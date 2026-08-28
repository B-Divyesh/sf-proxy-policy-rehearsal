use assert_cmd::Command;
use predicates::prelude::*;

#[test]
fn documented_example_passes() {
    Command::cargo_bin("ppr")
        .unwrap()
        .args(["test", "examples/monitor-policy.yaml"])
        .assert()
        .success()
        .stdout(predicate::str::contains("9 passed · 0 failed"))
        .stdout(predicate::str::contains(
            "forwarded header ignored: peer is untrusted",
        ));
}

#[test]
fn json_mode_is_scriptable() {
    Command::cargo_bin("ppr")
        .unwrap()
        .args([
            "test",
            "examples/monitor-policy.yaml",
            "--adapter",
            "caddy",
            "--json",
        ])
        .assert()
        .success()
        .stdout(predicate::str::contains("\"failed\": 0"))
        .stdout(predicate::str::contains("\"adapter\": \"caddy\""));
}

#[test]
fn mismatch_exits_one() {
    let source = include_str!("../examples/monitor-policy.yaml").replacen(
        "anubis: allow",
        "anubis: block",
        1,
    );
    let file = tempfile::NamedTempFile::new().unwrap();
    std::fs::write(file.path(), source).unwrap();
    Command::cargo_bin("ppr")
        .unwrap()
        .arg("test")
        .arg(file.path())
        .assert()
        .code(1)
        .stdout(predicate::str::contains("1 failed"));
}

#[test]
fn invalid_policy_exits_two_with_repair() {
    let file = tempfile::NamedTempFile::new().unwrap();
    std::fs::write(
        file.path(),
        "version: 2\ndefault: challenge\nadapters: {}\n",
    )
    .unwrap();
    Command::cargo_bin("ppr")
        .unwrap()
        .arg("validate")
        .arg(file.path())
        .assert()
        .code(2)
        .stderr(predicate::str::contains("version must be 1"))
        .stderr(predicate::str::contains("at least one adapter"));
}
