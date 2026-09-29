/**
 * SIH 2026 PRIVACY-PRESERVING BROWSER AGENT — FINAL VALIDATION SUITE
 * Executes all regression suites across Tasks 5-13 and verifies production build.
 */

const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const testSuites = [
  { name: 'Task 5 (Agent Loop)', cmd: 'node scratch/test-agent-loop.cjs' },
  { name: 'Task 6 (Privacy Budget)', cmd: 'node scratch/test-privacy-budget.cjs' },
  { name: 'Task 7 (Adaptive Redaction)', cmd: 'node scratch/test-redaction-policy.js' },
  { name: 'Task 8 (Benchmark Harness)', cmd: 'node benchmark/run-benchmark.cjs' },
  { name: 'Task 9 (Agent Reliability Benchmark)', cmd: 'node benchmark/run-benchmark.cjs' },
  { name: 'Task 10 (Audit Dashboard Telemetry)', cmd: 'node scratch/test-dashboard-telemetry.js' },
  { name: 'Task 11 (Privacy Threat Model Boundary)', cmd: 'node scratch/test-privacy-boundary.cjs' },
  { name: 'Task 12 (Real-World Evaluation)', cmd: 'node benchmark/run-task12-eval.cjs' },
  { name: 'Task 13 (Demo Network Boundary)', cmd: 'node scratch/test-demo-network-boundary.cjs' },
  { name: 'Production Build Check', cmd: 'npm run build' }
];

function runFinalValidation() {
  console.log('==================================================');
  console.log('STARTING SIH 2026 COMPREHENSIVE FINAL VALIDATION');
  console.log('==================================================\n');

  const results = {};
  let overallPassed = true;

  for (const suite of testSuites) {
    process.stdout.write(`Executing ${suite.name}... `);
    try {
      execSync(suite.cmd, { cwd: rootDir, stdio: 'pipe' });
      console.log('✅ PASS');
      results[suite.name] = 'PASS';
    } catch (err) {
      console.log('❌ FAIL');
      results[suite.name] = 'FAIL';
      overallPassed = false;
      console.error(`\nFailure log for ${suite.name}:\n`, err.stderr ? err.stderr.toString() : err.message);
    }
  }

  const task11Passed = results['Task 11 (Privacy Threat Model Boundary)'] === 'PASS';
  const task13Passed = results['Task 13 (Demo Network Boundary)'] === 'PASS';
  const privacyBoundaryOverall = (task11Passed && task13Passed) ? 'PASS' : 'FAIL';

  console.log('\n========================================');
  console.log('SIH 2026 FINAL VALIDATION');
  console.log('========================================\n');
  console.log(`Task 5: ${results['Task 5 (Agent Loop)']}`);
  console.log(`Task 6: ${results['Task 6 (Privacy Budget)']}`);
  console.log(`Task 7: ${results['Task 7 (Adaptive Redaction)']}`);
  console.log(`Task 8: ${results['Task 8 (Benchmark Harness)']}`);
  console.log(`Task 9: ${results['Task 9 (Agent Reliability Benchmark)']}`);
  console.log(`Task 10: ${results['Task 10 (Audit Dashboard Telemetry)']}`);
  console.log(`Task 11: ${results['Task 11 (Privacy Threat Model Boundary)']}`);
  console.log(`Task 12: ${results['Task 12 (Real-World Evaluation)']}`);
  console.log(`Task 13: ${results['Task 13 (Demo Network Boundary)']}`);
  console.log('');
  console.log(`Build: ${results['Production Build Check']}`);
  console.log('');
  console.log(`Privacy Boundary: ${privacyBoundaryOverall}`);
  console.log('\n========================================\n');

  if (!overallPassed) {
    process.exit(1);
  }
}

runFinalValidation();
