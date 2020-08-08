import * as _ from 'lodash';
import React from 'react';
import * as vega from 'vega';
import {
    createClassFromSpec
} from "react-vega";
import spec from './spec-percentiles';

const PercentilesChart = createClassFromSpec({
    spec
});

export {
    PercentilesChart
};