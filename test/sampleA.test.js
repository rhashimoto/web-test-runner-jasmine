describe('foo', function() {
  it('tests something', async function() {
    expect(true).toBeTruthy();
    expect(false).toBeTruthy();
    expect('foo').toBe('bar');
  });
});

describe('outer suite', function() {
  describe('inner suite', function() {
    it('nested', async function() {
      expect(1).toBe(1);
    });
  });
});