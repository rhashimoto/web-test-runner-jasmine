describe('foo', function() {
  it('tests something', async function() {
    expect(true).toBeTruthy();
    expect(false).toBeTruthy();
  });
});

describe('outer suite', function() {
  describe('inner suite', function() {
    it('nested', async function() {
      expect(1).toBe(2);
      expect(1).toBe(1);
    });
  });
});