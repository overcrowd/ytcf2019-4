

export interface Apex {
    x: number;
    y: number;
}


export class Polygon {
    private apexes: Apex[] = [];
    private square: number = 0;


    public addApex(apex: Apex): void {
        this.apexes.push(apex);


        // подсчитываем собственную площадь (если вершин уже 3 и более)
        // считается по кол-ву треугольников, равному nApexes-2 (базовая и последняя вершины) - именно так происходит сечение
        if (this.apexes.length < 3) return ;

        let apex0 = this.apexes[0];
        let square = 0;
        for (let i = 1; i < this.apexes.length - 1; i++) {
            square += this.getTriangleSquare(apex0, this.apexes[i], this.apexes[i+1]);
        }

        console.log("SELF SQUARE = " + square);
        this.square = square;
    }


    public checkCoordinate(apex0: Apex): boolean {
        // console.log(`CHECKING: x=${apex0.x}, y=${apex0.y}`)
        if (this.square === 0) throw new Error("self square is 0");

        let squareNew = 0;
        for (let i = 0; i < this.apexes.length - 1; i++) {
            squareNew += this.getTriangleSquare(apex0, this.apexes[i], this.apexes[i+1]);
        }
        squareNew += this.getTriangleSquare(apex0, this.apexes[this.apexes.length - 1], this.apexes[0]);

        // console.log(`SQUARE2 = ${squareNew}`);
        return this.square.toFixed(3) === squareNew.toFixed(3) ? true : false;
    }


    private getTriangleSquare(apex0: Apex, apex1: Apex, apex2: Apex): number {
        const a = Math.sqrt(Math.pow((apex0.x - apex1.x), 2) + Math.pow((apex0.y - apex1.y), 2))
        const b = Math.sqrt(Math.pow((apex1.x - apex2.x), 2) + Math.pow((apex1.y - apex2.y), 2))
        const c = Math.sqrt(Math.pow((apex2.x - apex0.x), 2) + Math.pow((apex2.y - apex0.y), 2))
        const p = (a + b + c) / 2;
        return Math.sqrt(p * (p - a)*(p - b)*(p - c));
    }


    public toString(): string {
        return "Polygon: " + JSON.stringify(this.apexes);
    }
}