const canvas = document.querySelector('.canvas');
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'rgba(255,255,255,1)';
ctx.fillRect(0, 0, 512, 512);
let field;
const array = [];

function drawField(a, b) {
  for (let i = 0; i < a; i += 1) {
    array[i] = [];
    for (let j = 0; j < b; j += 1) {
      array[i][j] = 1;
    }
  }
}

class DrawOnCanvas {
  constructor() {
    this.flag = null;
    this.lastX = null;
    this.lastY = null;
    this.color = null;
  }

  draw() {
    this.color = document.querySelector('.current_color').style.backgroundColor;
    if (!this.flag) return;
    let x = event.offsetX;
    let y = event.offsetY;
    x = Math.floor(x / field);
    y = Math.floor(y / field);
    ctx.fillStyle = `${this.color}`;
    ctx.fillRect(x * field, y * field, field, field);
  }

  drawBrasenham() {
    this.color = document.querySelector('.current_color').style.backgroundColor;
    ctx.fillStyle = `${this.color}`;
    if (!this.flag) return;
    let x1 = this.lastX;
    let y1 = this.lastY;
    x1 = Math.floor(this.lastX / field);
    y1 = Math.floor(this.lastY / field);
    let x2 = event.offsetX;
    let y2 = event.offsetY;
    x2 = Math.floor(x2 / field);
    y2 = Math.floor(y2 / field);

    if (x1 === x2 && y1 === y2) {
      ctx.fillRect(x1 * field, y1 * field, field, field);
      return;
    }
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const sightX = (deltaX < 0) ? -1 : 1;
    const sightY = (deltaY < 0) ? -1 : 1;

    if (Math.abs(deltaY) < Math.abs(deltaX)) {
      const b = y1 - (deltaY / deltaX) * x1;

      while (x1 !== x2) {
        ctx.fillRect(x1 * field, Math.round((deltaY / deltaX) * x1 + b) * field, field, field);
        x1 += sightX;
      }
    } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
      const b = x1 - (deltaX / deltaY) * y1;
      while (y1 !== y2) {
        ctx.fillRect(Math.round((deltaX / deltaY) * y1 + b) * field, y1 * field, field, field);
        y1 += sightY;
      }
    }
    ctx.fillRect(x2 * field, y2 * field, field, field);
  }

  handleEvent(event) {
    switch (event.type) {
      case 'mousemove':
        this.drawBrasenham();
        [this.lastX, this.lastY] = [event.offsetX, event.offsetY];
        break;

      case 'mousedown':
        this.flag = true;
        [this.lastX, this.lastY] = [event.offsetX, event.offsetY];
        this.drawBrasenham();
        break;

      case 'mouseup':
        this.flag = false;
        this.drawBrasenham();
        break;

      case 'mouseleave':
        this.flag = false;
        this.drawBrasenham();
        break;

      default:
        this.flag = true;
        [this.lastX, this.lastY] = [event.offsetX, event.offsetY];
        this.draw();
        break;
    }
  }
}

class ColorOnCanvas {
  constructor() {
    this.currentColor = null;
    this.previousColor = null;
    this.colors = null;
    this.colorPicker = null;
    this.flag = false;
  }

  init() {
    this.currentColor = document.querySelector('.current_color');
    this.previousColor = document.querySelector('.previous_color');
    this.colors = document.querySelectorAll('.colors');
    this.colorPicker = document.querySelector('.color_input');
    this.flag = !this.flag;
  }

  changeColor() {
    for (let i = 0; i < this.colors.length; i += 1) {
      if (this.colors[i].classList.contains('color_input')) {
        this.colorPicker.addEventListener('change', () => {
          const color = event.target.value;
          this.colors[1].value = this.currentColor.style.backgroundColor;
          this.previousColor.style.backgroundColor = this.currentColor.style.backgroundColor;
          this.colors[0].value = color;
          this.currentColor.style.backgroundColor = color;
        });
      } else {
        this.colors[i].addEventListener('click', () => {
          if (i === 0) {
            const color = this.currentColor.style.backgroundColor;
            this.colors[1].value = this.colors[0].value;
            this.previousColor.style.backgroundColor = this.currentColor.style.backgroundColor;
            this.colors[0].value = color;
            this.currentColor.style.backgroundColor = color;
          } else if (i === 1) {
            const color = this.previousColor.style.backgroundColor;
            this.colors[1].value = this.colors[0].value;
            this.previousColor.style.backgroundColor = this.currentColor.style.backgroundColor;
            this.colors[0].value = color;
            this.currentColor.style.backgroundColor = color;
          } else {
            const color = this.colors[i].getAttribute('value');
            this.colors[1].value = this.currentColor.style.backgroundColor;
            this.previousColor.style.backgroundColor = this.currentColor.style.backgroundColor;
            this.colors[0].value = color;
            this.currentColor.style.backgroundColor = color;
          }
        });
      }
    }
  }
}

class ColorFillerOnCanvas {
  constructor() {
    this.color = null;
    this.clickedColor = null;
    this.imageData = null;
  }

  floodFill() {
    this.color = document.querySelector('.current_color').style.backgroundColor;
    this.imageData = ctx.getImageData(0, 0, 512, 512);
    const stack = [[event.offsetY, event.offsetX]];
    const viewed = {};
    let pixel;
    let canvasColor;
    let length = 1;
    this.clickedColor = `rgba(${
      this.imageData.data[event.offsetY * 4 * 512 + event.offsetX * 4]
    },${this.imageData.data[event.offsetY * 4 * 512 + event.offsetX * 4 + 1]},${
      this.imageData.data[event.offsetY * 4 * 512 + event.offsetX * 4 + 2]
    },1)`;

    const fac = new FastAverageColor();
    const avgColor = fac.getColor(canvas);

    if (this.clickedColor === avgColor.rgba) {
      ctx.fillStyle = `${this.color}`;
      ctx.fillRect(0, 0, 512, 512);
      this.imageData = ctx.getImageData(0, 0, 512, 512);
    } else {
      while (length > 0) {
        pixel = stack.pop();
        viewed.pixel = true;
        length -= 1;

        if (pixel[0] >= 0 && pixel[0] <= 512 && pixel[1] >= 0 && pixel[1] <= 512) {
          const rgb = `${this.color}`.slice(4, -1);
          const arrRgb = rgb.split(', ');
          canvasColor = `rgba(${this.imageData.data[pixel[0] * 4 * 512 + pixel[1] * 4]},${this.imageData.data[pixel[0] * 4 * 512 + pixel[1] * 4 + 1]},${this.imageData.data[pixel[0] * 4 * 512 + pixel[1] * 4 + 2]},1)`;

          if (canvasColor === this.clickedColor) {
            // Change data in Uint8ClampedArray
            [
              this.imageData.data[pixel[0] * 4 * 512 + pixel[1] * 4],
              this.imageData.data[pixel[0] * 4 * 512 + pixel[1] * 4 + 1],
              this.imageData.data[pixel[0] * 4 * 512 + pixel[1] * 4 + 2],
            ] = [arrRgb[0], arrRgb[1], arrRgb[2]];

            // Put neighbors in stack to check
            if (!viewed[[pixel[0] - 1, pixel[1]]]) {
              stack.push([pixel[0] - 1, pixel[1]]);
              length += 1;
            }
            if (!viewed[[pixel[0] - 1, pixel[1] - 1]]) {
              stack.push([pixel[0] - 1, pixel[1] - 1]);
              length += 1;
            }
            if (!viewed[[pixel[0] - 1, pixel[1] + 1]]) {
              stack.push([pixel[0] - 1, pixel[1] + 1]);
              length += 1;
            }
            if (!viewed[[pixel[0] + 1, pixel[1]]]) {
              stack.push([pixel[0] + 1, pixel[1]]);
              length += 1;
            }
          }
        }
      }
    }
    ctx.putImageData(this.imageData, 0, 0);
  }

  handleEvent(event) {
    if (event.type === 'mousedown') {
      this.floodFill();
    }
  }
}

const pencilDrawing = new DrawOnCanvas();
const colorDrowing = new ColorOnCanvas();
const colorFiller = new ColorFillerOnCanvas();

document.querySelector('.choose_color').addEventListener('click', () => {
  if (!colorDrowing.flag) {
    colorDrowing.init();
    colorDrowing.changeColor();
  }
  canvas.removeEventListener('mousedown', colorFiller);
  canvas.removeEventListener('mousemove', pencilDrawing);
  canvas.removeEventListener('mousedown', pencilDrawing);
  canvas.removeEventListener('mouseup', pencilDrawing);
  canvas.removeEventListener('mouseleave', pencilDrawing);
  document.querySelector('.pencil').classList.remove('active');
  document.querySelector('.paint_bucket').classList.remove('active');
  document.querySelector('.choose_color').classList.add('active');
});

document.querySelector('.pencil').addEventListener('click', () => {
  canvas.removeEventListener('mousedown', colorFiller);
  canvas.addEventListener('mousemove', pencilDrawing);
  canvas.addEventListener('mousedown', pencilDrawing);
  canvas.addEventListener('mouseup', pencilDrawing);
  canvas.addEventListener('mouseleave', pencilDrawing);
  document.querySelector('.choose_color').classList.remove('active');
  document.querySelector('.paint_bucket').classList.remove('active');
  document.querySelector('.pencil').classList.add('active');
});

document.querySelector('.paint_bucket').addEventListener('click', () => {
  canvas.addEventListener('mousedown', colorFiller);
  canvas.removeEventListener('mousemove', pencilDrawing);
  canvas.removeEventListener('mousedown', pencilDrawing);
  canvas.removeEventListener('mouseup', pencilDrawing);
  canvas.removeEventListener('mouseleave', pencilDrawing);
  document.querySelector('.choose_color').classList.remove('active');
  document.querySelector('.pencil').classList.remove('active');
  document.querySelector('.paint_bucket').classList.add('active');
});

document.querySelector('.clear_canvas').onclick = () => {
  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.fillRect(0, 0, 512, 512);
};

document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyB') {
    canvas.addEventListener('mousedown', colorFiller);
    canvas.removeEventListener('mousemove', pencilDrawing);
    canvas.removeEventListener('mousedown', pencilDrawing);
    canvas.removeEventListener('mouseup', pencilDrawing);
    canvas.removeEventListener('mouseleave', pencilDrawing);
    document.querySelector('.choose_color').classList.remove('active');
    document.querySelector('.pencil').classList.remove('active');
    document.querySelector('.paint_bucket').classList.add('active');
  }
  if (event.code === 'KeyP') {
    canvas.removeEventListener('mousedown', colorFiller);
    canvas.addEventListener('mousemove', pencilDrawing);
    canvas.addEventListener('mousedown', pencilDrawing);
    canvas.addEventListener('mouseup', pencilDrawing);
    canvas.addEventListener('mouseleave', pencilDrawing);
    document.querySelector('.choose_color').classList.remove('active');
    document.querySelector('.paint_bucket').classList.remove('active');
    document.querySelector('.pencil').classList.add('active');
  }
  if (event.code === 'KeyC') {
    if (!colorDrowing.flag) {
      colorDrowing.init();
      colorDrowing.changeColor();
    }
    canvas.removeEventListener('mousedown', colorFiller);
    canvas.removeEventListener('mousemove', pencilDrawing);
    canvas.removeEventListener('mousedown', pencilDrawing);
    canvas.removeEventListener('mouseup', pencilDrawing);
    canvas.removeEventListener('mouseleave', pencilDrawing);
    document.querySelector('.pencil').classList.remove('active');
    document.querySelector('.paint_bucket').classList.remove('active');
    document.querySelector('.choose_color').classList.add('active');
  }
});

window.addEventListener('load', () => {
  if (localStorage.getItem('canvasImage') !== null) {
    const canvasImage = localStorage.getItem('canvasImage');
    const image = new Image();
    image.src = canvasImage;
    image.onload = () => ctx.drawImage(image, 0, 0);
  }
  canvas.removeEventListener('mousedown', colorFiller);
  canvas.addEventListener('mousemove', pencilDrawing);
  canvas.addEventListener('mousedown', pencilDrawing);
  canvas.addEventListener('mouseup', pencilDrawing);
  canvas.addEventListener('mouseleave', pencilDrawing);
  document.querySelector('.pencil').classList.add('active');
  drawField(4, 4);
  field = 128;
});

window.addEventListener('beforeunload', () => {
  localStorage.setItem('canvasImage', canvas.toDataURL());
});

document.querySelector('.four').addEventListener('click', () => {
  drawField(4, 4);
  field = 128;
});

document.querySelector('.sixteen').addEventListener('click', () => {
  drawField(16, 16);
  field = 32;
});

document.querySelector('.thirty_two').addEventListener('click', () => {
  drawField(32, 32);
  field = 16;
});

document.querySelector('.one').addEventListener('click', () => {
  drawField(1, 1);
  field = 512;
});
