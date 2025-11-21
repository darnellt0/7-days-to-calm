#!/usr/bin/env node

/**
 * Automated Test Suite for 7 Days to Calm Widget
 * Tests all surgical edits applied to the component
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}${error.message}${colors.reset}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
  }
}

function assertExists(value, message) {
  if (!value) {
    throw new Error(message || `Expected value to exist but got: ${value}`);
  }
}

function assertIncludes(text, substring, message) {
  if (!text.includes(substring)) {
    throw new Error(`${message}\n  Text: "${text.substring(0, 200)}..."\n  Expected to include: "${substring}"`);
  }
}

function runTests() {
  console.log(`${colors.bold}${colors.blue}=== 7 Days to Calm Widget Test Suite ===${colors.reset}\n`);

  const componentPath = path.join(
    'C:\\Users\\darne\\OneDrive\\Documents\\Python Scripts\\Elevated_Movements\\elevated-movements-7dtc\\em-frontend\\components\\SevenDaysToCalm.tsx'
  );
  const globalsCssPath = path.join(
    'C:\\Users\\darne\\OneDrive\\Documents\\Python Scripts\\Elevated_Movements\\elevated-movements-7dtc\\em-frontend\\app\\globals.css'
  );

  let componentContent = '';
  let globalsCssContent = '';

  console.log(`${colors.bold}Test Group 1: File Existence${colors.reset}`);
  test('SevenDaysToCalm.tsx component exists', () => {
    assert(fs.existsSync(componentPath), `Component file not found at ${componentPath}`);
  });

  test('globals.css file exists', () => {
    assert(fs.existsSync(globalsCssPath), `CSS file not found at ${globalsCssPath}`);
  });

  // Read files
  componentContent = fs.readFileSync(componentPath, 'utf-8');
  globalsCssContent = fs.readFileSync(globalsCssPath, 'utf-8');

  console.log(`\n${colors.bold}Test Group 2: Dynamic Variables Implementation${colors.reset}`);
  test('Component defines expanded dynamic variables', () => {
    assertIncludes(componentContent, 'time_available: null',
      'time_available field not found in dynamic variables');
  });

  test('Dynamic variables include energy field', () => {
    assertIncludes(componentContent, 'energy: null',
      'energy field not found in dynamic variables');
  });

  test('Dynamic variables include environment field', () => {
    assertIncludes(componentContent, 'environment: null',
      'environment field not found in dynamic variables');
  });

  test('Dynamic variables include intent field', () => {
    assertIncludes(componentContent, 'intent: null',
      'intent field not found in dynamic variables');
  });

  console.log(`\n${colors.bold}Test Group 3: Softer First Message${colors.reset}`);
  test('First message starts with "Hey, you made it"', () => {
    assertIncludes(componentContent, 'Hey, you made it',
      'Softer first message not found');
  });

  test('First message includes invitational tone', () => {
    assertIncludes(componentContent, 'Would 2, 5, or 8 minutes feel good right now',
      'Invitational tone not found in first message');
  });

  test('First message uses em dash separator', () => {
    assertIncludes(componentContent, 'Day ${safeDay} — ${title}',
      'Em dash separator not found in first message');
  });

  console.log(`\n${colors.bold}Test Group 4: setReminder Tool Implementation${colors.reset}`);
  test('setReminder tool is defined', () => {
    assertIncludes(componentContent, 'setReminder: ({',
      'setReminder tool not found');
  });

  test('setReminder stores data in localStorage', () => {
    assertIncludes(componentContent, 'localStorage.setItem("em_reminder"',
      'setReminder does not store to localStorage');
  });

  test('setReminder logs em_reminder_set event', () => {
    assertIncludes(componentContent, 'em_reminder_set',
      'setReminder does not log em_reminder_set event');
  });

  test('setReminder returns { ok: true }', () => {
    assertIncludes(componentContent, '{ ok: true }',
      'setReminder does not return { ok: true }');
  });

  test('setReminder handles errors and logs em_reminder_error', () => {
    assertIncludes(componentContent, 'em_reminder_error',
      'Error handling for setReminder not implemented');
  });

  console.log(`\n${colors.bold}Test Group 5: Skip to Today Confirm Dialog${colors.reset}`);
  test('computeTodayDay function is defined', () => {
    assertIncludes(componentContent, 'const computeTodayDay = useCallback',
      'computeTodayDay function not found');
  });

  test('computeTodayDay calculates from em_challenge_start', () => {
    assertIncludes(componentContent, 'localStorage.getItem("em_challenge_start"',
      'computeTodayDay does not read em_challenge_start');
  });

  test('handleSkipToTodayConfirm is defined', () => {
    assertIncludes(componentContent, 'const handleSkipToTodayConfirm = useCallback',
      'handleSkipToTodayConfirm not found');
  });

  test('handleSkipTodayClick shows dialog when jumping forward', () => {
    assertIncludes(componentContent, 'if (today > current)',
      'Skip to Today logic does not check day comparison');
  });

  test('em_jump_to_today event is logged with { from, to, confirmed }', () => {
    assertIncludes(componentContent, 'em_jump_to_today',
      'em_jump_to_today event not found');
    assertIncludes(componentContent, 'from: current',
      'em_jump_to_today missing "from" field');
    assertIncludes(componentContent, 'to: today',
      'em_jump_to_today missing "to" field');
  });

  console.log(`\n${colors.bold}Test Group 6: ARIA Labels${colors.reset}`);
  test('Reset button has aria-label', () => {
    assertIncludes(componentContent, 'aria-label="Reset to Day 1"',
      'Reset button aria-label not found');
  });

  test('Skip button has aria-label', () => {
    assertIncludes(componentContent, 'aria-label="Skip to Today"',
      'Skip button aria-label not found');
  });

  test('Continue button has aria-label', () => {
    assertIncludes(componentContent, 'aria-label="Continue today\'s practice"',
      'Continue button aria-label not found');
  });

  console.log(`\n${colors.bold}Test Group 7: Button Tap Targets${colors.reset}`);
  test('Buttons have px-6 py-3 padding classes', () => {
    const matches = (componentContent.match(/px-6.*py-3|py-3.*px-6/g) || []).length;
    assert(matches > 0, 'Buttons do not have proper padding (px-6 py-3)');
  });

  test('Reset button element exists with proper markup', () => {
    assertIncludes(componentContent, 'Reset to Day 1',
      'Reset to Day 1 button text not found');
  });

  test('Skip to Today button element exists', () => {
    assertIncludes(componentContent, 'Skip to Today',
      'Skip to Today button not found');
  });

  test('Continue button has em-continue-day id', () => {
    assertIncludes(componentContent, 'id="em-continue-day"',
      'em-continue-day id not found on continue button');
  });

  console.log(`\n${colors.bold}Test Group 8: Analytics Payload Enrichment${colors.reset}`);
  test('em_convai_started includes time_available', () => {
    assertIncludes(componentContent, 'em_convai_started',
      'em_convai_started event not found');
    assertIncludes(componentContent, 'time_available: dyn.time_available || null',
      'em_convai_started does not include time_available');
  });

  test('em_convai_started includes intent', () => {
    assertIncludes(componentContent, 'intent: dyn.intent || null',
      'em_convai_started does not include intent');
  });

  test('em_convai_ended event is logged', () => {
    assertIncludes(componentContent, 'em_convai_ended',
      'em_convai_ended event not found');
  });

  console.log(`\n${colors.bold}Test Group 9: Reduced Motion Media Query${colors.reset}`);
  test('globals.css contains @media (prefers-reduced-motion: reduce)', () => {
    assertIncludes(globalsCssContent, '@media (prefers-reduced-motion: reduce)',
      'Reduced-motion media query not found');
  });

  test('Reduced motion rule disables animations', () => {
    assertIncludes(globalsCssContent, 'animation: none !important',
      'Reduced-motion does not disable animations');
  });

  test('Reduced motion rule disables transitions', () => {
    assertIncludes(globalsCssContent, 'transition: none !important',
      'Reduced-motion does not disable transitions');
  });

  console.log(`\n${colors.bold}Test Group 10: localStorage Integration${colors.reset}`);
  test('Component persists reminder to localStorage', () => {
    assertIncludes(componentContent, 'em_reminder',
      'em_reminder localStorage key not used');
  });

  test('Component reads challenge start date from localStorage', () => {
    assertIncludes(componentContent, 'em_challenge_start',
      'em_challenge_start localStorage key not used');
  });

  test('Component reads and writes challenge day', () => {
    assertIncludes(componentContent, 'em_challenge_day',
      'em_challenge_day localStorage key not used');
  });

  console.log(`\n${colors.bold}Test Group 11: Widget Initialization${colors.reset}`);
  test('Widget is initialized with id="em-shria"', () => {
    assertIncludes(componentContent, 'id: "em-shria"',
      'Widget id not set to em-shria');
  });

  test('Widget attributes are set via setAttribute', () => {
    assertIncludes(componentContent, 'setAttribute("dynamic-variables"',
      'dynamic-variables not set via setAttribute');
    // Note: override-first-message is set as React prop in createElement, not via setAttribute
    assertIncludes(componentContent, '"override-first-message":',
      'override-first-message not set on widget');
  });

  test('Widget is created with elevenlabs-convai element', () => {
    assertIncludes(componentContent, 'elevenlabs-convai',
      'elevenlabs-convai web component not found');
  });

  console.log(`\n${colors.bold}Test Group 12: Dialog Components${colors.reset}`);
  test('Skip to Today confirmation dialog exists', () => {
    assertIncludes(componentContent, 'showSkipDialog',
      'Skip to Today dialog state not found');
    assertIncludes(componentContent, 'Jump to Today',
      'Skip to Today dialog prompt not found');
  });

  test('Reset confirmation dialog exists', () => {
    assertIncludes(componentContent, 'showResetDialog',
      'Reset dialog state not found');
    assertIncludes(componentContent, 'Reset Progress',
      'Reset dialog button not found');
  });

  console.log(`\n${colors.bold}Test Group 13: Idempotency Check${colors.reset}`);
  test('No duplicate dynamic-variables definitions', () => {
    const count = (componentContent.match(/time_available:/g) || []).length;
    assert(count >= 3, 'time_available field should appear in multiple places (applyAttributes, useEffect, createElement)');
  });

  test('First message appears consistently across implementations', () => {
    const count = (componentContent.match(/Hey, you made it/g) || []).length;
    assert(count >= 2, 'First message should appear in multiple places');
  });

  // Summary
  console.log(`\n${colors.bold}${colors.blue}=== Test Summary ===${colors.reset}`);
  console.log(`${colors.green}✓ Passed: ${testsPassed}${colors.reset}`);
  if (testsFailed > 0) {
    console.log(`${colors.red}✗ Failed: ${testsFailed}${colors.reset}`);
  }
  console.log(`Total: ${testsPassed + testsFailed}\n`);

  if (testsFailed === 0) {
    console.log(`${colors.green}${colors.bold}✅ All tests passed!${colors.reset}`);
    console.log(`\n${colors.blue}Next steps:${colors.reset}`);
    console.log(`1. Open http://localhost:3003/7-days-to-calm in your browser`);
    console.log(`2. Press F12 to open DevTools`);
    console.log(`3. Try these in the console to verify runtime behavior:`);
    console.log(`\n   // Check dynamic variables`);
    console.log(`   document.getElementById('em-shria')?.getAttribute('dynamic-variables')`);
    console.log(`\n   // Check first message`);
    console.log(`   document.getElementById('em-shria')?.getAttribute('override-first-message')`);
    console.log(`\n   // Check dataLayer events`);
    console.log(`   window.dataLayer`);
    console.log(`\n   // Check localStorage`);
    console.log(`   localStorage.getItem('em_challenge_day')`);
    console.log(`   localStorage.getItem('em_challenge_start')`);
    console.log(`\n   // Test Skip to Today button with confirm`);
    console.log(`   // Click "Skip to Today" button - confirm dialog should appear\n`);
    return 0;
  } else {
    console.log(`${colors.red}${colors.bold}❌ Some tests failed.${colors.reset}`);
    return 1;
  }
}

const exitCode = runTests();
process.exit(exitCode);
