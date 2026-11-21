param(
    [Parameter(Mandatory=$true)][string]$OutputPath,
    [switch]$ConfirmDev
)
$ErrorActionPreference = 'Stop'
if (-not $ConfirmDev) { throw 'Confirm the approved Dev target manually, then use -ConfirmDev. No connections are made by this generator.' }
if (Test-Path -LiteralPath $OutputPath) { throw 'Output already exists; refusing to overwrite' }
$migrationPath = Join-Path $PSScriptRoot '../../manual-migrations/20261120000100_order_user_history.sql'
# A changed installer needs a new static review, not silent text replacement.
$expectedHash = 'FC52EB13CC09F4767E9289007D09BE3A33F06012F793CD72FF7E85054FB74216'
$source = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $migrationPath)).Replace("`r`n", "`n")
$sha = [Security.Cryptography.SHA256]::Create()
try { $actualHash = [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($source))).Replace('-', '') }
finally { $sha.Dispose() }
if ($actualHash -ne $expectedHash) {
    throw 'Installer changed since review. Stop and review before regenerating the probe.'
}
if ([regex]::Matches($source,'(?m)^BEGIN;\r?$').Count -ne 1 -or [regex]::Matches($source,'(?m)^COMMIT;\r?$').Count -ne 1) {
    throw 'Unexpected installer transaction boundaries'
}
$body = [regex]::Replace($source,'(?m)^(BEGIN|COMMIT);\r?$', '-- Transaction boundary supplied by reversible harness.')
$prefix = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'reversible-prefix.sql'))
$assertions = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'reversible-assertions.sql'))
$probe = $prefix + "`n" + $body + "`n" + $assertions
if ([regex]::IsMatch($probe,'(?im)^\s*COMMIT\s*;') -or
    [regex]::Matches($probe,'(?m)^BEGIN;\r?$').Count -ne 1 -or
    [regex]::Matches($probe,'(?m)^ROLLBACK;\r?$').Count -ne 1) {
    throw 'Probe must contain exactly one BEGIN, one ROLLBACK and no COMMIT'
}
# This only writes SQL to a local file. It never starts psql or opens a connection.
[IO.File]::WriteAllText([IO.Path]::GetFullPath($OutputPath), $probe, [Text.UTF8Encoding]::new($false))
Write-Output ([IO.Path]::GetFullPath($OutputPath))
