use ipnet::IpNet;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use std::fmt;
use std::net::IpAddr;
use std::path::Path;
use std::str::FromStr;

pub const ADAPTERS: [&str; 3] = ["anubis", "caddy", "nginx"];

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Action {
    Allow,
    Challenge,
    Block,
}

impl fmt::Display for Action {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let value = match self {
            Self::Allow => "allow",
            Self::Challenge => "challenge",
            Self::Block => "block",
        };
        write!(f, "{value}")
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Policy {
    pub version: u8,
    pub default: Action,
    #[serde(default)]
    pub trusted_proxies: Vec<String>,
    pub adapters: BTreeMap<String, AdapterConfig>,
    #[serde(default)]
    pub rules: Vec<Rule>,
    #[serde(default)]
    pub cases: Vec<Case>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AdapterConfig {
    pub forwarded_header: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Rule {
    pub name: String,
    pub action: Action,
    #[serde(default)]
    pub adapters: Vec<String>,
    #[serde(rename = "match")]
    pub matches: Matchers,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Matchers {
    #[serde(default)]
    pub client_ip: Vec<String>,
    #[serde(default)]
    pub path: Vec<String>,
    #[serde(default)]
    pub methods: Vec<String>,
    #[serde(default)]
    pub headers: BTreeMap<String, String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Case {
    pub name: String,
    pub request: Request,
    #[serde(default)]
    pub dns: BTreeMap<String, Vec<String>>,
    #[serde(default)]
    pub expect: BTreeMap<String, Action>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Request {
    pub remote_ip: String,
    #[serde(default = "default_method")]
    pub method: String,
    #[serde(default = "default_path")]
    pub path: String,
    #[serde(default)]
    pub headers: BTreeMap<String, String>,
}

fn default_method() -> String {
    "GET".into()
}
fn default_path() -> String {
    "/".into()
}

#[derive(Debug, Clone, Serialize)]
pub struct Report {
    pub source: String,
    pub summary: Summary,
    pub results: Vec<ResultRow>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Summary {
    pub passed: usize,
    pub failed: usize,
    pub unchecked: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct ResultRow {
    pub case: String,
    pub adapter: String,
    pub client_ip: String,
    pub client_source: String,
    pub decision: Action,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expected: Option<Action>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub passed: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub matched_rule: Option<String>,
    pub explanation: String,
}

pub fn load_policy(path: &Path) -> Result<Policy, String> {
    let bytes =
        std::fs::read(path).map_err(|error| format!("cannot read {}: {error}", path.display()))?;
    let extension = path
        .extension()
        .and_then(|v| v.to_str())
        .unwrap_or_default();
    let policy = if extension.eq_ignore_ascii_case("json") {
        serde_json::from_slice(&bytes)
            .map_err(|error| format!("invalid JSON in {}: {error}", path.display()))?
    } else {
        serde_yaml::from_slice(&bytes)
            .map_err(|error| format!("invalid YAML in {}: {error}", path.display()))?
    };
    validate_policy(&policy)?;
    Ok(policy)
}

pub fn validate_policy(policy: &Policy) -> Result<(), String> {
    let mut errors = Vec::new();
    if policy.version != 1 {
        errors.push(format!("version must be 1, got {}", policy.version));
    }
    if policy.adapters.is_empty() {
        errors.push("adapters must declare at least one adapter".into());
    }
    for (name, config) in &policy.adapters {
        if !ADAPTERS.contains(&name.as_str()) {
            errors.push(format!(
                "adapter {name:?} is unsupported; use anubis, caddy, or nginx"
            ));
        }
        if !matches!(
            config.forwarded_header.to_ascii_lowercase().as_str(),
            "x-forwarded-for" | "x-real-ip"
        ) {
            errors.push(format!(
                "adapter {name:?}: forwarded_header must be X-Forwarded-For or X-Real-IP"
            ));
        }
    }
    for value in &policy.trusted_proxies {
        if parse_net(value).is_err() {
            errors.push(format!(
                "trusted_proxies contains invalid IP/CIDR {value:?}"
            ));
        }
    }
    let mut rule_names = BTreeSet::new();
    for rule in &policy.rules {
        if rule.name.trim().is_empty() {
            errors.push("rule names cannot be empty".into());
        }
        if !rule_names.insert(rule.name.clone()) {
            errors.push(format!("duplicate rule name {:?}", rule.name));
        }
        if rule.matches.client_ip.is_empty()
            && rule.matches.path.is_empty()
            && rule.matches.methods.is_empty()
            && rule.matches.headers.is_empty()
        {
            errors.push(format!("rule {:?} has no matchers", rule.name));
        }
        for adapter in &rule.adapters {
            if !policy.adapters.contains_key(adapter) {
                errors.push(format!(
                    "rule {:?} names undeclared adapter {adapter:?}",
                    rule.name
                ));
            }
        }
        for candidate in &rule.matches.client_ip {
            if let Some(name) = candidate.strip_prefix("dns:") {
                if name.trim().is_empty() {
                    errors.push(format!("rule {:?} has an empty dns: matcher", rule.name));
                }
            } else if parse_net(candidate).is_err() {
                errors.push(format!(
                    "rule {:?} has invalid client_ip {candidate:?}",
                    rule.name
                ));
            }
        }
        for pattern in &rule.matches.path {
            if pattern.matches('*').count() > 1 {
                errors.push(format!(
                    "rule {:?} path {pattern:?} uses more than one * wildcard",
                    rule.name
                ));
            }
        }
    }
    let mut case_names = BTreeSet::new();
    for case in &policy.cases {
        if !case_names.insert(case.name.clone()) {
            errors.push(format!("duplicate case name {:?}", case.name));
        }
        if IpAddr::from_str(&case.request.remote_ip).is_err() {
            errors.push(format!(
                "case {:?} has invalid remote_ip {:?}",
                case.name, case.request.remote_ip
            ));
        }
        if !case.request.path.starts_with('/') {
            errors.push(format!("case {:?} path must start with /", case.name));
        }
        for (adapter, expected) in &case.expect {
            let _ = expected;
            if !policy.adapters.contains_key(adapter) {
                errors.push(format!(
                    "case {:?} expects undeclared adapter {adapter:?}",
                    case.name
                ));
            }
        }
        for (name, answers) in &case.dns {
            if answers.is_empty() {
                errors.push(format!(
                    "case {:?} DNS name {name:?} has no mock answers",
                    case.name
                ));
            }
            for answer in answers {
                if IpAddr::from_str(answer).is_err() {
                    errors.push(format!(
                        "case {:?} DNS {name:?} has invalid answer {answer:?}",
                        case.name
                    ));
                }
            }
        }
    }
    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors.join("\n"))
    }
}

pub fn run(
    policy: &Policy,
    source: impl Into<String>,
    adapter_filter: &[String],
    case_filter: Option<&str>,
) -> Result<Report, String> {
    let adapters: Vec<&str> = if adapter_filter.is_empty() {
        policy.adapters.keys().map(String::as_str).collect()
    } else {
        for adapter in adapter_filter {
            if !policy.adapters.contains_key(adapter) {
                return Err(format!(
                    "adapter {adapter:?} is not declared in this policy"
                ));
            }
        }
        adapter_filter.iter().map(String::as_str).collect()
    };
    let cases: Vec<&Case> = policy
        .cases
        .iter()
        .filter(|case| case_filter.is_none_or(|needle| case.name.contains(needle)))
        .collect();
    if let Some(filter) = case_filter {
        if cases.is_empty() {
            return Err(format!("no cases match {filter:?}"));
        }
    }
    let trusted = parse_networks(&policy.trusted_proxies)?;
    let mut rows = Vec::new();
    for case in cases {
        for adapter in &adapters {
            let config = &policy.adapters[*adapter];
            let (client_ip, client_source) = resolve_client(case, config, &trusted)?;
            let (decision, matched_rule, explanation) = decide(policy, case, adapter, client_ip)?;
            let expected = case.expect.get(*adapter).copied();
            rows.push(ResultRow {
                case: case.name.clone(),
                adapter: (*adapter).into(),
                client_ip: client_ip.to_string(),
                client_source,
                decision,
                expected,
                passed: expected.map(|want| want == decision),
                matched_rule,
                explanation,
            });
        }
    }
    let passed = rows.iter().filter(|r| r.passed == Some(true)).count();
    let failed = rows.iter().filter(|r| r.passed == Some(false)).count();
    let unchecked = rows.iter().filter(|r| r.passed.is_none()).count();
    let total = rows.len();
    Ok(Report {
        source: source.into(),
        summary: Summary {
            passed,
            failed,
            unchecked,
            total,
        },
        results: rows,
    })
}

fn resolve_client(
    case: &Case,
    config: &AdapterConfig,
    trusted: &[IpNet],
) -> Result<(IpAddr, String), String> {
    let remote = IpAddr::from_str(&case.request.remote_ip)
        .map_err(|_| format!("case {:?}: invalid remote_ip", case.name))?;
    if !contains(trusted, remote) {
        return Ok((
            remote,
            "direct peer (forwarded header ignored: peer is untrusted)".into(),
        ));
    }
    let Some(raw) = header(&case.request.headers, &config.forwarded_header) else {
        return Ok((
            remote,
            format!(
                "direct peer (trusted, but {} is absent)",
                config.forwarded_header
            ),
        ));
    };
    if config.forwarded_header.eq_ignore_ascii_case("x-real-ip") {
        let ip = IpAddr::from_str(raw.trim())
            .map_err(|_| format!("case {:?}: X-Real-IP is not an IP address", case.name))?;
        return Ok((ip, "X-Real-IP from trusted peer".into()));
    }
    let chain: Result<Vec<IpAddr>, _> =
        raw.split(',').map(|v| IpAddr::from_str(v.trim())).collect();
    let chain = chain.map_err(|_| {
        format!(
            "case {:?}: X-Forwarded-For contains an invalid IP address",
            case.name
        )
    })?;
    if chain.is_empty() {
        return Ok((remote, "direct peer (empty X-Forwarded-For)".into()));
    }
    let client = chain
        .iter()
        .rev()
        .find(|ip| !contains(trusted, **ip))
        .copied()
        .unwrap_or(chain[0]);
    Ok((
        client,
        "X-Forwarded-For, right-to-left from trusted peer".into(),
    ))
}

fn decide(
    policy: &Policy,
    case: &Case,
    adapter: &str,
    client_ip: IpAddr,
) -> Result<(Action, Option<String>, String), String> {
    let mut misses = Vec::new();
    for rule in &policy.rules {
        if !rule.adapters.is_empty() && !rule.adapters.iter().any(|item| item == adapter) {
            continue;
        }
        let mut reasons = Vec::new();
        if !rule.matches.client_ip.is_empty()
            && !client_matches(client_ip, &rule.matches.client_ip, &case.dns)?
        {
            reasons.push("client IP".to_string());
        }
        if !rule.matches.path.is_empty()
            && !rule
                .matches
                .path
                .iter()
                .any(|pattern| glob_match(pattern, &case.request.path))
        {
            reasons.push("path".to_string());
        }
        if !rule.matches.methods.is_empty()
            && !rule
                .matches
                .methods
                .iter()
                .any(|method| method.eq_ignore_ascii_case(&case.request.method))
        {
            reasons.push("method".to_string());
        }
        for (name, expected) in &rule.matches.headers {
            if header(&case.request.headers, name).is_none_or(|actual| actual != expected) {
                reasons.push(format!("header {name}"));
            }
        }
        if reasons.is_empty() {
            return Ok((
                rule.action,
                Some(rule.name.clone()),
                format!("first match: {}", rule.name),
            ));
        }
        misses.push(format!("{} missed {}", rule.name, reasons.join(" + ")));
    }
    let detail = if misses.is_empty() {
        "no applicable rules".into()
    } else {
        misses.join("; ")
    };
    Ok((policy.default, None, format!("default: {detail}")))
}

fn client_matches(
    client: IpAddr,
    candidates: &[String],
    dns: &BTreeMap<String, Vec<String>>,
) -> Result<bool, String> {
    for candidate in candidates {
        if let Some(name) = candidate.strip_prefix("dns:") {
            if dns.get(name).is_some_and(|answers| {
                answers
                    .iter()
                    .any(|answer| IpAddr::from_str(answer).ok() == Some(client))
            }) {
                return Ok(true);
            }
        } else if parse_net(candidate)?.contains(&client) {
            return Ok(true);
        }
    }
    Ok(false)
}

fn header<'a>(headers: &'a BTreeMap<String, String>, name: &str) -> Option<&'a str> {
    headers
        .iter()
        .find(|(key, _)| key.eq_ignore_ascii_case(name))
        .map(|(_, value)| value.as_str())
}

fn parse_networks(values: &[String]) -> Result<Vec<IpNet>, String> {
    values.iter().map(|value| parse_net(value)).collect()
}
fn parse_net(value: &str) -> Result<IpNet, String> {
    if let Ok(net) = IpNet::from_str(value) {
        return Ok(net);
    }
    IpAddr::from_str(value)
        .map(IpNet::from)
        .map_err(|_| format!("invalid IP or CIDR {value:?}"))
}
fn contains(networks: &[IpNet], ip: IpAddr) -> bool {
    networks.iter().any(|network| network.contains(&ip))
}

fn glob_match(pattern: &str, value: &str) -> bool {
    if pattern == "*" {
        return true;
    }
    match pattern.split_once('*') {
        None => pattern == value,
        Some((start, rest)) if !rest.contains('*') => {
            value.starts_with(start)
                && value.ends_with(rest)
                && value.len() >= start.len() + rest.len()
        }
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn glob_is_intentionally_small() {
        assert!(glob_match("/api/*", "/api/status"));
        assert!(!glob_match("/api/*", "/health"));
        assert!(!glob_match("**/bad/*", "/bad/thing"));
    }

    #[test]
    fn forwarded_chain_stops_at_untrusted_hop() {
        let case = Case {
            name: "chain".into(),
            request: Request {
                remote_ip: "10.0.0.2".into(),
                method: "GET".into(),
                path: "/".into(),
                headers: BTreeMap::from([(
                    "X-Forwarded-For".into(),
                    "198.51.100.7, 10.0.0.3".into(),
                )]),
            },
            dns: BTreeMap::new(),
            expect: BTreeMap::new(),
        };
        let config = AdapterConfig {
            forwarded_header: "X-Forwarded-For".into(),
        };
        let (ip, _) = resolve_client(&case, &config, &["10.0.0.0/8".parse().unwrap()]).unwrap();
        assert_eq!(ip.to_string(), "198.51.100.7");
    }
}
