import * as _ from 'lodash';
import React from 'react';
import * as vega from 'vega';

import spec from './spec-percentiles';

export class PercentilesChart extends React.PureComponent {

    constructor(props) {
        super(props);
        this.containerRef = React.createRef();
        this.view = null;

        this.spec = _.cloneDeep(spec);
        this.spec.data[0].values = this.props.data;
    }

    componentDidMount() {
        this.view = new vega.View(vega.parse(this.spec), {
            renderer: 'canvas',
            container: this.containerRef.current,
            hover: true
        });
        this.view.addEventListener('mouseover', function (name, value) {
            console.log("Got event back", name, value)
        });
        return this.view.runAsync();
    }

    componentWillUnmount() {
        if (this.view) {
            this.view.finalize();
        }
    }

    // https://gist.github.com/simonw/7e4b21d0f3cc1d17eaa314fb3f904843
    componentDidUpdate() {
        console.log("Update", this.props);
        var changeset = vega.changeset().remove(() => true).insert(this.props.data);
        this.view.change("table", changeset).run()
    }


    render() {
        return React.createElement("div", {
            ref: this.containerRef,
        });
    }
}