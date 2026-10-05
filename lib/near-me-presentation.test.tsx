import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import CoverageMeasurementChoice from '../components/CoverageMeasurementChoice';

test('dormant choice distinguishes preference from collection and leaves withdrawal outside collapsed options', () => {
  const previous = process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED;
  process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED = 'false';
  try {
    for (const choice of [null, 'enabled', 'disabled'] as const) {
      const html = renderToStaticMarkup(<CoverageMeasurementChoice choice={choice} choose={() => {}} />);
      assert.match(html, /Collection is currently off/);
      assert.match(html, /href="\/privacy#regional-measurement"/);
      assert.match(html, /Discovery and location permission do not require sharing/);
      assert.doesNotMatch(html, /<details[^>]*open/);
      if (choice === 'enabled') {
        assert.match(html, /Preference: allow regional sharing/);
        assert.ok(html.indexOf('Don’t share regional usage') < html.indexOf('<details'));
        assert.equal(html.split('Don’t share regional usage').length - 1, 1);
      } else assert.match(html, choice === 'disabled' ? /Preference: don’t share/ : /No sharing preference chosen/);
    }
    process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED = 'true';
    assert.match(renderToStaticMarkup(<CoverageMeasurementChoice choice="disabled" choose={() => {}} />), /Collection requires your permission/);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED;
    else process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED = previous;
  }
});
