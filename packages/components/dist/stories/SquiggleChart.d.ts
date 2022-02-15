import * as PropTypes from 'prop-types';
export declare const SquiggleChart: {
    ({ squiggleString }: {
        squiggleString: string;
    }): JSX.Element;
    propTypes: {
        squiggleString: PropTypes.Requireable<string>;
    };
    defaultProps: {
        squggleString: string;
    };
};
export declare function numberShow(number: number, precision?: number): {
    value: string;
    power?: undefined;
    symbol?: undefined;
} | {
    value: string;
    power: number;
    symbol?: undefined;
} | {
    value: string;
    symbol: string;
    power?: undefined;
};
