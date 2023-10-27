import { RelativeValuesClusterInput } from './createRelativeValuesDefinition';
import { ZodError } from 'zod';

describe('RelativeValuesClusterInput color validation', () => {
  it('accepts lowercase hexadecimal color codes', () => {
    const input = {
      id: 'test',
      color: '#abcdef',
    };

    expect(() => RelativeValuesClusterInput.parse(input)).not.toThrow(ZodError);
  });

  it('accepts uppercase hexadecimal color codes', () => {
    const input = {
      id: 'test',
      color: '#ABCDEF',
    };

    expect(() => RelativeValuesClusterInput.parse(input)).not.toThrow(ZodError);
  });

  it('throws an error for invalid color codes', () => {
    const input = {
      id: 'test',
      color: 'invalid',
    };

    expect(() => RelativeValuesClusterInput.parse(input)).toThrow(ZodError);
  });
});
