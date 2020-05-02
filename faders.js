// Source code of the faders icons

const drawFader = (x, pos) => {
    this.ctx.strokeStyle = '#424c53';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, 2);
    this.ctx.lineTo(x, 30);
    this.ctx.stroke();

    this.ctx.fillStyle = '#5c5f63';
    this.ctx.strokeStyle = '#acadaf';
    this.ctx.beginPath();
    this.ctx.rect(x-4 + 0.5, pos + 0.5, 7, 2);
    this.ctx.fill();
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
}
drawFader(7, 8);
drawFader(16, 20);
drawFader(25, 13);