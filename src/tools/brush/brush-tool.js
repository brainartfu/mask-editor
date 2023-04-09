import { fabricCanvas, state, tools, getEditCanvas, getBgCanvas } from "../../state/utils";
const cursor = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAAXNSR0IArs4c6QAAAW9JREFUSEvFly1Tw0AQhp+VYLFg0VgsWLBoLA4GBxo0roNrLZbaIMGCpLb8hlaGefMxaY6EuTSX3M7E3e6ze7fZD8NXUo6AQ2Af2AUOCtUlsAJ+gG+MLx+T9u+hNAOcAKcFzMemnEiANyxzqFHawSnHwEUHoAsQdIbx2URuBqcZUFGGkATjxTX0F5xyCVm0IeUdY7ZpsA4OG6nreC3yCpy/qaIdUiblm+fgPHsfeiSSr7NKuHtlewk+B858tXuem2O8luAnYKenQV/1FcaNkVekK1+tQOcmAof8Z339SgS+LWqwr1KIcwuBH4G9ENY62FgK/NxBIdjRqOBoVx0tuaL9TpEKSN4kxiyZa4zr6E1CbVHZPXSjWAN3VVvMr3uMt3YGgbIeDdswsj5cosYa9j4wpu3D3jCR1yJtj7iC6801/G2bcEqkabeBvoIr2zXY6/N1QECtMBpnt1hh3AZYLW1a1uTE5tImmJa3RVuErrlfChtgMUeQA88AAAAASUVORK5CYII='

export class BrushTool {
  constructor(editCanvas, bgCanvas, mainRef) {
    this.mainRef = mainRef;
    this.editCanvas = editCanvas;
    this.bgCanvas = bgCanvas;
    this.tempCanvas = document.createElement('canvas');
    this.isErasing = false;
    this.restore = false;
    this.erasingData = [];
    this.redoData = [];
    this.brushWidth = 10;
    this.lastPoint = [];
    this.mask = null;
    this.image = null;
    this.box = {width: 0, height: 0, left: 0, top: 0};
    this.lastBox = {width: 0, height: 0, left: 0, top: 0};
    this.dimension = {width: 0, height: 0};
    this.originalImage = null;
  }
  drawPoint(point) {
    console.log(point)
  }
  setOriginalImage(image) {
    this.originalImage = image;
  }
  drawImage(img) {
    const {width, height, _element} = img;
    this.image = img;
    this.editCanvas.width = width;
    this.editCanvas.height = height;
    this.bgCanvas.width = width;
    this.bgCanvas.height = height;
    this.tempCanvas.width = width;
    this.tempCanvas.height = height;
    this.box = {width: width, height: height, left: 0, top: 0}
    this.dimension = {width: width, height: height}
    let ctx = this.editCanvas.getContext('2d');
    ctx.drawImage(_element, 0, 0, this.editCanvas.width, this.editCanvas.height);
    this.drawMask();
    this.setBrushWidth(this.brushWidth);
  }
  drawMask() {
    const image = new Image();
    image.onload = () => {
      const canvas = this.bgCanvas;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const threshold = 80;
      for (let i = 0; i < imageData.data.length; i += 4) {
        const red = imageData.data[i];
        const green = imageData.data[i + 1];
        const blue = imageData.data[i + 2];

        const grayscale = (red + green + blue) / 3;
        //if color is black, remove. if not, set color.
        if (grayscale < threshold) {
          imageData.data[i + 3] = 0;
        } else {
          imageData.data[i] = 96;
          imageData.data[i + 1] = 231;
          imageData.data[i + 2] = 84;

        }
      }
      context.putImageData(imageData, 0, 0);
      const that = this;
      const img = new Image();
      img.src = canvas.toDataURL();
      img.onload = function() {
        that.mask = img;
      };
      this.drawOverlaping()    
    };
    image.src = './729ab0c3-71e9-4038-8c97-4f6e68379d02.png';
  }
  startErasing(e) {
    this.isErasing = true;
    const context = this.bgCanvas.getContext("2d");
    context.strokeStyle = "rgb(96, 231, 84)";
    context.globalCompositeOperation = "source-over";
    context.lineJoin = "round";
    context.lineCap = "round";
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    this.lastPoint = [x, y];
    if (this.restore) {
      context.globalCompositeOperation = "destination-out"; 
    }
    context.beginPath();
    context.moveTo(x, y);
    context.lineWidth = this.brushWidth;
    context.lineTo(x+0.1, y+0.1);
    context.stroke();
    if (this.erasingData.length > 0 && this.erasingData[this.erasingData.length-1] !== null) {
      this.erasingData = [...this.erasingData, null, [x, y, this.brushWidth, this.restore]];
    } else {
      this.erasingData = [...this.erasingData, [x, y, this.brushWidth, this.restore]];
    }
  }
  drawOverlaping() {
    console.log(this.box)
    const canvas = document.createElement('canvas');
    canvas.width = this.editCanvas.width;
    canvas.height = this.editCanvas.height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, this.editCanvas.width, this.editCanvas.height);
    ctx.drawImage(this.bgCanvas, 0, 0, this.editCanvas.width, this.editCanvas.height);
    ctx.globalCompositeOperation = "source-in";
    ctx.drawImage(this.editCanvas, 0, 0, this.editCanvas.width, this.editCanvas.height);
    ctx.globalCompositeOperation = "source-over";
    state().setReplaced(true);
    tools().canvas.addMainImage(canvas.toDataURL(), 'drawImage');
  }  
  stopErasing() {
    this.isErasing = false;
    this.lastPoint = null;
    this.drawOverlaping();
  };  
  erase(e) { 
    if (!this.isErasing) return;
    const lastPoint = this.lastPoint;
    const context = this.bgCanvas.getContext("2d");

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    const newPoint = [x, y];

    const distance = Math.sqrt(
      Math.pow(newPoint[0] - lastPoint[0], 2) +
        Math.pow(newPoint[1] - lastPoint[1], 2)
    );
    const angle = Math.atan2(
      newPoint[1] - lastPoint[1],
      newPoint[0] - lastPoint[0]
    );

    const steps = Math.ceil(distance / 2);
    for (let i = 0; i < steps; i++) {
      const newX = lastPoint[0] + Math.cos(angle) * distance * (i / steps);
      const newY = lastPoint[1] + Math.sin(angle) * distance * (i / steps);
      context.lineTo(newX, newY);
      context.stroke();
      this.lastPoint = [newX, newY];
      this.erasingData = [...this.erasingData, [newX, newY, this.brushWidth, this.restore]]
    }
  }
  undoDraw(state="redraw") {
    const canvas = this.bgCanvas;
    const context = canvas.getContext("2d");
    const editCanvas = this.editCanvas;
    const editCtx = editCanvas.getContext('2d');
    const tempCanvas = this.tempCanvas;
    const tempCtx = tempCanvas.getContext('2d');
    const erasingData = this.erasingData;
    if (erasingData.length > 0 || true) {
      if (state === 'undo') {
        while (erasingData.length) {
          const lastLine = erasingData.pop();
          if (lastLine === null) {
            break;
          }
        }
      } else if (state === 'redo') {
        console.log('redo')
      }
      const width = this.dimension.width;
      const height = this.dimension.height;
      editCtx.clearRect(0, 0, this.editCanvas.width, this.editCanvas.height)
      editCtx.save();
      editCtx.translate(this.editCanvas.width/2, this.editCanvas.height/2);
      context.clearRect(0, 0, this.editCanvas.width, this.editCanvas.height)
      context.save();
      context.translate(this.editCanvas.width/2, this.editCanvas.height/2);
      
      if (this.mask) {
        tempCtx.clearRect(0, 0, width, height)
        tempCtx.drawImage(this.mask, 0, 0);
      } else {
        tempCtx.clearRect(0, 0, width, height)
      }
      tempCtx.save();
      tempCtx.strokeStyle = "rgb(96, 231, 84)";
      tempCtx.lineJoin = "round";
      tempCtx.lineCap = "round";
      if (erasingData[0]) {
        tempCtx.globalCompositeOperation = erasingData[0][3]?"destination-out":"source-over"; 
        tempCtx.lineWidth = erasingData[0][2]*1;
        tempCtx.beginPath(erasingData[0][0], erasingData[0][1]);
        tempCtx.lineTo(erasingData[0][0]+0.1, erasingData[0][1]+0.1);
      }
      let tleft = 0;
      let ttop = 0;
      for (let i = 1; i < erasingData.length; i++) {
        if (erasingData[i] === null) {
          tempCtx.stroke();
          tempCtx.beginPath();
        } else if (typeof erasingData[i] === 'string' || erasingData[i] instanceof String) {
          if (erasingData[i] === 'rotateLeft') {
            context.rotate(-Math.PI / 2);
            editCtx.rotate(-Math.PI / 2);
            tempCtx.rotate(Math.PI / 2);  
          } else if (erasingData[i] === 'rotateRight') {
            context.rotate(Math.PI / 2);
            editCtx.rotate(Math.PI / 2);
            tempCtx.rotate(-Math.PI / 2); 
          } else if (erasingData[i] === 'flipX') {
            context.scale(-1, 1);
            editCtx.scale(-1, 1);
            tempCtx.scale(1, -1); 
          } else if (erasingData[i] === 'flipY') {
            context.scale(1, -1);
            editCtx.scale(1, -1);
            tempCtx.scale(-1, 1); 
          } else {
            const crop = JSON.parse(erasingData[i]);
            tleft += crop.left;
            ttop += crop.top;
            if (state === 'undo') {
              console.log(crop)
              this.lastBox = crop
            };
          }
          tempCtx.stroke();
          tempCtx.beginPath();
        } else {
          tempCtx.globalCompositeOperation = erasingData[i][3]?"destination-out":"source-over"; 
          tempCtx.lineWidth = erasingData[i][2]*1;
          tempCtx.lineTo(erasingData[i][0]+tleft, erasingData[i][1]+ttop);
        }
      }
      if (erasingData.length) tempCtx.stroke();
      tempCtx.restore();
      let twidth, theight = 0;
      if (this.box.width === this.editCanvas.width) {
        twidth = this.editCanvas.width;
        theight = this.editCanvas.height;
      } else {
        theight = this.editCanvas.width;
        twidth = this.editCanvas.height;
      }
      console.log( "draw", this.box)
      context.drawImage(tempCanvas, this.box.left, this.box.top, this.box.width, this.box.height, -twidth/2, -theight/2, twidth, theight);
      context.restore();
      editCtx.drawImage(this.image._element, this.box.left, this.box.top, this.box.width, this.box.height, -twidth/2, -theight/2, twidth, theight);
      editCtx.restore()
      this.erasingData = erasingData;
      this.drawOverlaping();
    }

  };
  setBrushWidth(brushWidth) {
    let canvas = document.createElement('canvas');
    canvas.width = brushWidth;
    canvas.height = brushWidth;
    let ctx = canvas.getContext('2d');
    let img = new Image();
    img.src = cursor;
    const that = this;
    img.onload = function() {
      ctx.drawImage(img, 0, 0, brushWidth, brushWidth);
      let resizedImageData = canvas.toDataURL();
      that.bgCanvas.style.cursor = `url(${resizedImageData}) ${brushWidth/2} ${brushWidth/2}, auto`;
    };
    this.brushWidth = brushWidth;
  }
  setRestore(val) {
    this.restore = val;
  }
  rotate(degrees) {
    console.log('rotate', this.box)
    this.erasingData.push(null);
    this.erasingData.push(degrees>0?'rotateRight':'rotateLeft');
    const width = this.editCanvas.width;
    const height = this.editCanvas.height;
    const editCanvas = this.editCanvas;
    editCanvas.width = height;
    editCanvas.height = width;
    console.log('rotate', editCanvas.width, editCanvas.height)
    this.bgCanvas.width = height;
    this.bgCanvas.height = width;
    this.undoDraw('redraw');
  }
  flip(val) {
    this.erasingData.push(null);
    this.erasingData.push(val);
    this.editCanvas.width = this.editCanvas.width;
    this.editCanvas.height = this.editCanvas.height;    
    this.bgCanvas.width = this.editCanvas.width;
    this.bgCanvas.height = this.editCanvas.height;
    this.undoDraw('redraw');
  }
  undoErasing() {
    console.log('undasf')
    console.log(this.erasingData)
    if (this.erasingData.length > 0 && this.erasingData[this.erasingData.length-1].indexOf('width') > 0) {
      const crop = JSON.parse(this.erasingData[this.erasingData.length -1]);
      console.log(this.lastBox);
      this.box = this.lastBox;
      tools().canvas.resize(this.lastBox.width, this.lastBox.height)
    }
    if (this.erasingData.length === 0) {
      this.lastBox = {left: 0, top: 0, width: this.dimension.width, height: this.dimension.height}
      this.box = this.lastBox;
      tools().canvas.resize(this.lastBox.width, this.lastBox.height)
    }
    const editCanvas = this.editCanvas;
    editCanvas.width = this.box.width;
    editCanvas.height = this.box.height;    
    this.bgCanvas.width = this.box.width;
    this.bgCanvas.height = this.box.height;
    this.undoDraw('undo');
  }
  crop(box) {
    console.log(box);
    this.lastBox = this.box;
    this.box = {left: this.box.left+box.left, top: this.box.top+box.top, width: box.width, height: box.height};
    this.erasingData.push(null);
    this.erasingData.push(JSON.stringify(box));
    const editCanvas = this.editCanvas;
    editCanvas.width = this.box.width;
    editCanvas.height = this.box.height;    
    this.bgCanvas.width = this.box.width;
    this.bgCanvas.height = this.box.height;
    this.undoDraw('redraw');
  }
  canUndo() {
    return this.erasingData.length > 0
  }
  canRedo() {
    return this.redoData.length > 0
  }
  resize(width, height) {
    // const panelWidth = this.mainRef.clientWidth || this.mainRef.offsetWidth;
    // const scaleWidth = (panelWidth/2-10)/width;
    // this.editCanvas.style.scale = scaleWidth;
    // this.bgCanvas.style.scale = scaleWidth;
    // this.mainRef.getElementsByClassName('fabric-editor')[0].style.scale = 0.5;
  }
  download() {
    const rate = this.originalImage.width/this.dimension.width;
    const width = this.box.width * rate;
    const height = this.box.height * rate;
    const left = this.box.left * rate;
    const top = this.box.top * rate;
    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this.bgCanvas, 0, 0, this.bgCanvas.width, this.bgCanvas.height, 0, 0, width, height);
    ctx.globalCompositeOperation = "source-in";
    ctx.save();
    ctx.translate(width/2, height/2);
    for (var i = 0; i < this.erasingData.length; i++) {
      if ((typeof this.erasingData[i] === 'string' || this.erasingData[i] instanceof String) && this.erasingData[i].indexOf('width') === -1) {
        console.log(this.erasingData[i])
        if (this.erasingData[i] === 'rotateLeft') {
          ctx.rotate(-Math.PI / 2);  
        } else if (this.erasingData[i] === 'rotateRight') {
          ctx.rotate(Math.PI / 2); 
        } else if (this.erasingData[i] === 'flipX') {
          ctx.scale(-1, 1); 
        } else if (this.erasingData[i] === 'flipY') {
          ctx.scale(1, -1); 
        }
      }
    }
    ctx.drawImage(this.originalImage._element, left,top, width, height, -width/2, -height/2, width, height);
    ctx.restore();
    const dataURL = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = dataURL;
    downloadLink.download = "erased-background.png";
    downloadLink.click();
  }
}