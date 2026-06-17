/** Jest para tests unitarios de dominio (lógica pura, sin BD). */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  moduleNameMapper: {
    '^@nexus/contracts$': '<rootDir>/../../../packages/contracts/src/index.ts',
  },
};
