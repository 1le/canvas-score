class Renderable2D {

    constructor(cW, cH) {
        this.x = Math.round(Math.random() * cW);
        this.y = Math.round(Math.random() * cH);
        this.width = Math.round(cW / 50);
        this.height = Math.round(cH/ 50);
        this.velocity = this._generateRandomVelocity();
    }

    _generateRandomVelocity() {
        return {
            x: 3 - Math.round(Math.random() * 6),
            y: 3 - Math.round(Math.random() * 6)
        }
    }

    move(maxX, maxY) {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        if (this.x < 1 || this.x > maxX) this.velocity.x = -this.velocity.x;
        if (this.y < 1 || this.y > maxY) this.velocity.y = -this.velocity.y;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + 0, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }
}

module.exports = Renderable2D;