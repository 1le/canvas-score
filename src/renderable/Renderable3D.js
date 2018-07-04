

class Renderable3D {

    constructor(cW, cH, gl) {
        this.x = 0.95 - Math.random() * 195 / 100;
        this.y = 0.95 - Math.random() * 195 / 100;
        this.width = 0.05;
        this.height = 0.05;
        this.velocity = this._generateRandomVelocity();

        this.vertices = new Float32Array([
            this.x + this.width,  this.y + this.height,
            this.x,  this.y + this.height,
            this.x + this.width, this.y,
            this.x, this.y
        ]);

        this.vbuffer = gl.createBuffer();

        this.itemSize = 2;
        this.numItems = this.vertices.length / this.itemSize;
    }

    _generateRandomVelocity() {
        return {
            x: 0.03 - Math.random() * 6 / 100,
            y: 0.03 - Math.random() * 6 / 100
        }
    }

    move() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        if (this.x <= -1 || this.x > 0.95) this.velocity.x = -this.velocity.x;
        if (this.y <= -1 || this.y > 0.95) this.velocity.y = -this.velocity.y;

        this.vertices = new Float32Array([
            this.x + this.width,  this.y + this.height,
            this.x,  this.y + this.height,
            this.x + this.width, this.y,
            this.x, this.y
        ]);

    }

    draw(gl, shaderProgram) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        shaderProgram.aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.aVertexPosition);
        gl.vertexAttribPointer(shaderProgram.aVertexPosition, this.itemSize, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numItems);
    }
}

module.exports = Renderable3D;