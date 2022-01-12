import TextareaAutosize from 'react-textarea-autosize';
import React from 'react';

export class AutosizeTextareaInput extends React.Component {
  /**
   * @param props
   */
  constructor(props) {
    super(props);
    this.state = { value: this.props.value || "" };
    this.handleChange = this.handleChange.bind(this);
    this.handleHeightChange = this.handleHeightChange.bind(this);
  }

  handleChange(event) {
    const { value } = event.target;
    this.setState({ value });
    this.props.onChange(value);
  }

  handleHeightChange() {
    this.props.onHeightChange();
  }

  render() {
    return React.createElement(TextareaAutosize, {
      style: this.props.style,
      className: this.props.className,

      rows: this.props.rows,
      maxRows: this.props.maxRows,
      minRows: this.props.minRows,
      value: this.state.value,
      onChange: this.handleChange,
      onHeightChange: this.handleHeightChange,
      useCacheForDOMMeasurements: this.props.useCacheForDOMMeasurements,
    });
  }
}
