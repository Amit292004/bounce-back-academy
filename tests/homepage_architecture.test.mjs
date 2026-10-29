import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Homepage Architecture, UX Consolidation & Toolkit Suite', () => {
  const pagePath = path.resolve('src/app/page.tsx');
  const finderPath = path.resolve('src/components/home/ClassExamFinder.tsx');
  const toolkitPath = path.resolve('src/components/home/FeaturesGrid.tsx');
  const analyticsPath = path.resolve('src/lib/analytics.ts');

  test('ClassExamFinder component exists and includes required options', () => {
    assert.ok(fs.existsSync(finderPath), 'ClassExamFinder.tsx must exist');
    const content = fs.readFileSync(finderPath, 'utf8');

    // Section title & explanation
    assert.ok(content.includes('Find Your Class or Exam'), 'Finder title must be present');
    assert.ok(
      content.includes('Choose your learning level and go directly to the resources you need'),
      'Explanatory subtitle must be present'
    );

    // School classes 8 to 12
    const requiredClasses = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
    for (const cls of requiredClasses) {
      assert.ok(content.includes(cls), `Finder must include ${cls}`);
    }

    // Competitive exams
    const requiredExams = ['JEE', 'NEET', 'CUET'];
    for (const exam of requiredExams) {
      assert.ok(content.includes(exam), `Finder must include ${exam}`);
    }

    // Accessible segmented tab controls
    assert.ok(content.includes('role="tablist"'), 'Segmented control has role=tablist');
    assert.ok(content.includes('role="tab"'), 'Segment buttons have role=tab');
    assert.ok(content.includes('role="tabpanel"'), 'Panels have role=tabpanel');
  });

  test('FeaturesGrid is refactored into Your Learning Toolkit with genuine utilities', () => {
    assert.ok(fs.existsSync(toolkitPath), 'FeaturesGrid.tsx must exist');
    const content = fs.readFileSync(toolkitPath, 'utf8');

    // Headline & description
    assert.ok(content.includes('Your Learning Toolkit'), 'Must have title "Your Learning Toolkit"');
    assert.ok(content.includes('Platform Utilities'), 'Must have eyebrow "Platform Utilities"');

    // Genuine platform tools
    assert.ok(content.includes('AI Doubt Solver'), 'Must include AI Doubt Solver');
    assert.ok(content.includes('Practice Quiz & Tests'), 'Must include Practice Quiz');
    assert.ok(content.includes('Premium Store'), 'Must include Premium Store');
    assert.ok(content.includes('Discussion Forum'), 'Must include Discussion Forum');
    assert.ok(content.includes('Study Library'), 'Must include Study Library');
    assert.ok(content.includes('Saved Favourites'), 'Must include Saved Favourites');

    // Exclusion of core syllabus resources from tools grid
    assert.ok(!content.includes("title: 'Question Papers'"), 'Must NOT include Question Papers as a platform tool');
    assert.ok(!content.includes("title: 'Study Notes'"), 'Must NOT include Study Notes as a platform tool');
    assert.ok(!content.includes("title: 'Video Lectures'"), 'Must NOT include Video Lectures as a platform tool');
  });

  test('Homepage eliminates redundant standalone class table and implements clean sequence', () => {
    assert.ok(fs.existsSync(pagePath), 'page.tsx must exist');
    const content = fs.readFileSync(pagePath, 'utf8');

    // Old redundant curriculum table removed
    assert.ok(!content.includes('id="classes"'), 'Old redundant id="classes" table must be removed');
    assert.ok(!content.includes('className={styles.classSection}'), 'Old .classSection must be removed');
    assert.ok(!content.includes('className={styles.classTable}'), 'Old .classTable must be removed');

    // Correct components imported and mounted
    assert.ok(content.includes('<HeroSection'), 'HeroSection must be rendered');
    assert.ok(content.includes('<LearningPathsSection'), 'LearningPathsSection must be rendered');
    assert.ok(content.includes('<ClassExamFinder'), 'ClassExamFinder must be rendered');
    assert.ok(content.includes('<FeaturesGrid'), 'FeaturesGrid (Toolkit) must be rendered');
    assert.ok(content.includes('<HowItWorksSection'), 'HowItWorksSection must be rendered');
    assert.ok(content.includes('<TestimonialsSection'), 'TestimonialsSection must be rendered');
    assert.ok(content.includes('<FaqSection'), 'FaqSection must be rendered');

    // Logical order verification
    const heroIndex = content.indexOf('<HeroSection');
    const ecoIndex = content.indexOf('<LearningPathsSection');
    const finderIndex = content.indexOf('<ClassExamFinder');
    const toolsIndex = content.indexOf('<FeaturesGrid');
    const howIndex = content.indexOf('<HowItWorksSection');
    const testIndex = content.indexOf('<TestimonialsSection');
    const faqIndex = content.indexOf('<FaqSection');

    assert.ok(heroIndex < ecoIndex, 'Hero before Ecosystem');
    assert.ok(ecoIndex < finderIndex, 'Ecosystem before ClassFinder');
    assert.ok(finderIndex < toolsIndex, 'ClassFinder before Tools');
    assert.ok(toolsIndex < howIndex, 'Tools before HowItWorks');
    assert.ok(howIndex < testIndex, 'HowItWorks before Testimonials');
    assert.ok(testIndex < faqIndex, 'Testimonials before FAQ');
  });

  test('Analytics utility exists and provides tracking functions', () => {
    assert.ok(fs.existsSync(analyticsPath), 'analytics.ts must exist');
    const content = fs.readFileSync(analyticsPath, 'utf8');

    assert.ok(content.includes('trackLearningPathClick'), 'Must export trackLearningPathClick');
    assert.ok(content.includes('trackClassExamSelect'), 'Must export trackClassExamSelect');
    assert.ok(content.includes('trackResourceOpen'), 'Must export trackResourceOpen');
    assert.ok(content.includes('trackPremiumOfferClick'), 'Must export trackPremiumOfferClick');
    assert.ok(content.includes('trackCheckoutStart'), 'Must export trackCheckoutStart');
    assert.ok(content.includes('trackPurchaseSuccess'), 'Must export trackPurchaseSuccess');
  });
});
