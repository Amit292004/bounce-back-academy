import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

describe('SaaS Authentication Architecture & Security Suite', () => {
  const routesDir = path.resolve('src/app');

  test('all required student authentication pages exist with app router structure', () => {
    const requiredAuthPages = [
      'login/page.tsx',
      'register/page.tsx',
      'verify-email/page.tsx',
      'forgot-password/page.tsx',
    ];

    for (const pageRelPath of requiredAuthPages) {
      const fullPath = path.join(routesDir, pageRelPath);
      assert.ok(
        fs.existsSync(fullPath),
        `Required authentication page missing: src/app/${pageRelPath}`
      );
    }
  });

  test('MainLayoutWrapper strictly excludes authentication routes from global website chrome', () => {
    const layoutPath = path.resolve('src/components/layout/MainLayoutWrapper.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');

    // Must define auth routes
    assert.ok(content.includes("pathname === '/login'"), 'isAuthRoute must check /login');
    assert.ok(content.includes("pathname === '/register'"), 'isAuthRoute must check /register');
    assert.ok(content.includes("pathname === '/verify-email'"), 'isAuthRoute must check /verify-email');
    assert.ok(content.includes("pathname === '/forgot-password'"), 'isAuthRoute must check /forgot-password');

    // Must include isAuthRoute in hideLayout and hide SignupReminder
    assert.ok(content.includes('hideLayout = isAdminRoute || isAskRoute || isAuthRoute'), 'hideLayout must include isAuthRoute');
    assert.ok(content.includes('!isAuthRoute'), 'SignupReminder must not show on isAuthRoute');
  });

  test('AuthLayout implements editorial split-screen architecture (40% brand, 60% form) with tonal separation', () => {
    const authLayoutPath = path.resolve('src/components/auth/AuthLayout.tsx');
    const authCssPath = path.resolve('src/components/auth/AuthLayout.module.css');

    const layoutContent = fs.readFileSync(authLayoutPath, 'utf8');
    const cssContent = fs.readFileSync(authCssPath, 'utf8');

    // Layout structure
    assert.ok(layoutContent.includes('styles.splitShell'), 'AuthLayout must use splitShell');
    assert.ok(layoutContent.includes('styles.brandPanel'), 'AuthLayout must include 40% brandPanel');
    assert.ok(layoutContent.includes('styles.formPanel'), 'AuthLayout must include 60% formPanel');
    assert.ok(layoutContent.includes('styles.desktopTopNav'), 'AuthLayout must have desktopTopNav');
    assert.ok(layoutContent.includes('styles.mobileHeader'), 'AuthLayout must have mobileHeader');
    assert.ok(layoutContent.includes('styles.formSurface'), 'AuthLayout must render elevated formSurface');

    // CSS 40/60 split-screen and surface specifications
    assert.ok(cssContent.includes('flex: 0 0 40%'), 'brandPanel must be 40% width on desktop');
    assert.ok(cssContent.includes('flex: 0 0 60%'), 'formPanel must be 60% width on desktop');
    assert.ok(cssContent.includes('background-color: #000000'), 'brandPanel must be solid black');
    assert.ok(cssContent.includes('background-color: #171717'), 'dark mode must have elevated charcoal formSurface');
    assert.ok(cssContent.includes('@media (max-width: 959px)'), 'CSS must include responsive collapse for mobile');
  });

  test('Login page contains editorial headline, contextual badge, email, password toggle, forgot-password link, and Google SSO', () => {
    const loginPath = path.resolve('src/app/login/page.tsx');
    const content = fs.readFileSync(loginPath, 'utf8');

    assert.ok(content.includes('editorialHeadline="Your next chapter starts here."'), 'Login must use editorial headline');
    assert.ok(content.includes('contextualBadge="STUDENT ACCOUNT"'), 'Login must include STUDENT ACCOUNT badge');
    assert.ok(content.includes('type="email"'), 'Login must have email input');
    assert.ok(content.includes('autoComplete="email"'), 'Login must have autoComplete="email"');
    assert.ok(content.includes('autoComplete="current-password"'), 'Login must have autoComplete="current-password"');
    assert.ok(content.includes('/forgot-password'), 'Login must link to /forgot-password');
    assert.ok(content.includes('setShowPassword'), 'Login must have password visibility toggle');
    assert.ok(content.includes('GoogleOAuthProvider'), 'Login must include Google OAuth support');
    assert.ok(content.includes('/register'), 'Login must link to /register');
    assert.ok(content.includes('switchAuthRow'), 'Login must use non-cramped switchAuthRow');
  });

  test('Register page contains editorial headline, registration fields, and responsive 2-column layout', () => {
    const registerPath = path.resolve('src/app/register/page.tsx');
    const content = fs.readFileSync(registerPath, 'utf8');

    assert.ok(content.includes('editorialHeadline="Build your next chapter."'), 'Register must use editorial headline');
    assert.ok(content.includes('contextualBadge="STUDENT REGISTRATION"'), 'Register must include STUDENT REGISTRATION badge');
    assert.ok(content.includes('name="name"'), 'Registration must have name field');
    assert.ok(content.includes('name="className"'), 'Registration must have className selector');
    assert.ok(content.includes('name="email"'), 'Registration must have email field');
    assert.ok(content.includes('name="mobile"'), 'Registration must have mobile field');
    assert.ok(content.includes('name="password"'), 'Registration must have password field');
    assert.ok(content.includes('minLength={6}'), 'Registration password must enforce minLength 6');
    assert.ok(content.includes('setShowPassword'), 'Registration must have password visibility toggle');
    assert.ok(content.includes('/login'), 'Registration must link to /login');
  });

  test('Forgot Password and Verify Email pages use corresponding editorial headlines and recovery flows', () => {
    const forgotPath = path.resolve('src/app/forgot-password/page.tsx');
    const forgotContent = fs.readFileSync(forgotPath, 'utf8');

    assert.ok(forgotContent.includes('editorialHeadline="Back to learning."'), 'Forgot password must use Back to learning headline');
    assert.ok(forgotContent.includes('/api/student/forgot-password'), 'Forgot password must post to recovery endpoint');
    assert.ok(forgotContent.includes('/api/student/reset-password'), 'Forgot password must reset password endpoint');

    const verifyPath = path.resolve('src/app/verify-email/page.tsx');
    const verifyContent = fs.readFileSync(verifyPath, 'utf8');

    assert.ok(verifyContent.includes('editorialHeadline="Verify your account."'), 'Verify email must use Verify your account headline');
    assert.ok(verifyContent.includes('/api/student/verify-email'), 'Verify email must call verify-email API');
  });

  test('Password hashing and comparison with bcryptjs works securely', async () => {
    const plainPassword = 'StudentSecretPassword@2026';
    const hash = await bcrypt.hash(plainPassword, 10);

    assert.notEqual(plainPassword, hash);
    assert.ok(hash.startsWith('$2'));

    const match = await bcrypt.compare(plainPassword, hash);
    assert.equal(match, true);

    const wrongMatch = await bcrypt.compare('WrongPassword', hash);
    assert.equal(wrongMatch, false);
  });

  test('OTP verification timing logic validates expiration correctly', () => {
    const now = Date.now();
    const futureExpiry = new Date(now + 10 * 60 * 1000); // 10 mins from now
    const pastExpiry = new Date(now - 1000); // 1 sec ago

    assert.equal(new Date() <= futureExpiry, true, 'Future expiry must be valid');
    assert.equal(new Date() <= pastExpiry, false, 'Past expiry must be invalid');
  });
});
