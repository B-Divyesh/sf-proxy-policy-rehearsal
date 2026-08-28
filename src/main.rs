use clap::{Args, Parser, Subcommand};
use proxy_policy_rehearsal::{Report, load_policy, run};
use std::path::PathBuf;

#[derive(Parser)]
#[command(
    name = "ppr",
    version,
    about = "Rehearse proxy decisions before deployment",
    long_about = "Load synthetic requests and mock DNS from a YAML or JSON file, then compare explainable allow/challenge/block decisions across Anubis, Caddy, and Nginx-compatible profiles. No network requests are made."
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Run policy cases and compare expected decisions
    Test(TestArgs),
    /// Parse and validate a policy without running it
    Validate { file: PathBuf },
    /// Show the supported file format and emulation boundary
    Format,
}

#[derive(Args)]
struct TestArgs {
    /// YAML or JSON policy test file
    file: PathBuf,
    /// Comma-separated declared adapters to run
    #[arg(long, value_delimiter = ',')]
    adapter: Vec<String>,
    /// Run cases whose names contain this text
    #[arg(long = "case")]
    case_filter: Option<String>,
    /// Emit stable JSON for CI and scripts
    #[arg(long)]
    json: bool,
}

fn main() {
    let code = match execute(Cli::parse()) {
        Ok(code) => code,
        Err(error) => {
            eprintln!("ppr: {error}");
            2
        }
    };
    std::process::exit(code);
}

fn execute(cli: Cli) -> Result<i32, String> {
    match cli.command {
        Command::Validate { file } => {
            let policy = load_policy(&file)?;
            println!(
                "Valid policy: {} rules, {} cases, {} adapters",
                policy.rules.len(),
                policy.cases.len(),
                policy.adapters.len()
            );
            Ok(0)
        }
        Command::Format => {
            println!("{}", include_str!("../docs/format.txt"));
            Ok(0)
        }
        Command::Test(args) => {
            let policy = load_policy(&args.file)?;
            let report = run(
                &policy,
                args.file.display().to_string(),
                &args.adapter,
                args.case_filter.as_deref(),
            )?;
            if args.json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&report).map_err(|e| e.to_string())?
                );
            } else {
                print_report(&report);
            }
            Ok(if report.summary.failed > 0 { 1 } else { 0 })
        }
    }
}

fn print_report(report: &Report) {
    println!("Proxy Policy Rehearsal  {}", report.source);
    println!(
        "{:<23} {:<8} {:<15} {:<11} {:<11}  EXPLANATION",
        "CASE", "ADAPTER", "CLIENT", "DECISION", "EXPECTED"
    );
    println!("{}", "─".repeat(106));
    for row in &report.results {
        let expected = row
            .expected
            .map(|v| v.to_string())
            .unwrap_or_else(|| "—".into());
        let mark = match row.passed {
            Some(true) => "✓",
            Some(false) => "✗",
            None => "·",
        };
        println!(
            "{:<23} {:<8} {:<15} {:<11} {:<11}  {} {}",
            truncate(&row.case, 22),
            row.adapter,
            row.client_ip,
            row.decision,
            expected,
            mark,
            row.explanation
        );
        println!("  client source: {}", row.client_source);
    }
    println!(
        "\n{} passed · {} failed · {} unchecked · {} decisions",
        report.summary.passed,
        report.summary.failed,
        report.summary.unchecked,
        report.summary.total
    );
}

fn truncate(value: &str, max: usize) -> String {
    if value.chars().count() <= max {
        value.into()
    } else {
        format!("{}…", value.chars().take(max - 1).collect::<String>())
    }
}
