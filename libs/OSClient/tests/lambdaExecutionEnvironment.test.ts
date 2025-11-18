import { getLambdaExecutionEnvironment } from '../lib/utils';

const DEFAULT_ENVIRONMENT = 'production';

const resetEnv = () => {
    process.env.EXECUTION_ENVIRONMENT = undefined;
};

describe('getLambdaExecutionEnvironment', () => {
    beforeEach(() => {
        resetEnv();
    });

    test("returns 'staging' when EXECUTION_ENVIRONMENT is 'staging'", () => {
        process.env.EXECUTION_ENVIRONMENT = 'staging';

        const env = getLambdaExecutionEnvironment();

        expect(env).toBe('staging');
    });

    test("returns 'production' when EXECUTION_ENVIRONMENT is 'production'", () => {
        process.env.EXECUTION_ENVIRONMENT = 'production';

        const env = getLambdaExecutionEnvironment();

        expect(env).toBe('production');
    });

    test("logs error and defaults to 'production' when EXECUTION_ENVIRONMENT is invalid", () => {
        console.error = jest.fn();
        process.env.EXECUTION_ENVIRONMENT = '';

        const env = getLambdaExecutionEnvironment();

        expect(env).toBe(DEFAULT_ENVIRONMENT);
        expect(console.error).toHaveBeenCalledWith(
            `EXECUTION_ENVIRONMENT environment variable is not defined: ''. Defaulting to 'production'.`,
        );
    });
});
