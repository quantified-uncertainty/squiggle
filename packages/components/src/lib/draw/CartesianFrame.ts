type TextOptions = {
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  font?: string;
  fillStyle?: string;
};

/*
Implemented by GPT-4.

Usage example:

frame.enter(); // Entering the Cartesian frame

// Draw your 2D charts here

frame.drawText('Label', 100, 50, { textAlign: 'center', textBaseline: 'middle', font: '14px Arial', fillStyle: 'blue' });

frame.exit(); // Exiting the Cartesian frame
*/

export class CartesianFrame {
  public context: CanvasRenderingContext2D;
  public x0: number;
  public y0: number;

  constructor(props: {
    context: CanvasRenderingContext2D;
    x0: number;
    y0: number;
  }) {
    this.context = props.context;
    this.x0 = props.x0;
    this.y0 = props.y0;
  }

  enter(): void {
    this.context.save();
    this.context.translate(this.x0, this.y0);
    this.context.scale(1, -1);
  }

  exit(): void {
    this.context.restore();
  }

  fillText(
    text: string,
    x: number,
    y: number,
    options: TextOptions = {}
  ): void {
    this.context.save();
    this.context.scale(1, -1); // Invert the scale for the text rendering
    if (options.textAlign !== undefined) {
      this.context.textAlign = options.textAlign;
    }
    if (options.font !== undefined) {
      this.context.font = options.font;
    }
    if (options.fillStyle !== undefined) {
      this.context.fillStyle = options.fillStyle;
    }
    if (options.textBaseline !== undefined) {
      this.context.textBaseline = options.textBaseline;
    }
    this.context.fillText(text, x, -y); // Use negative y value to adjust the position
    this.context.restore();
  }
}
