import * as winston from "winston";


export type Coord = {
    x: number;
    y: number;
}


class Polygon {
    protected logger: winston.Logger;
    protected apexes: Coord[] = [];
    protected square: number = 0;


    constructor(logger: winston.Logger) {
        this.logger = logger;
    }


    // добавление вершины многоугольника
    //
    public addApex(apex: Coord): void {
        this.apexes.push(apex);

        // для определения того, попала ли точка в многоугольник, нужно знать площадь этого многоугольника
        // для этого каждый раз при добавлении вершины, подсчитываем его собственную площадь (если вершин уже 3 и более)
        // считается по кол-ву треугольников, равному nApexes-2 (базовая и последняя вершины) - именно так происходит сечение
        if (this.apexes.length >= 3) {
            let apex0 = this.apexes[0];
            let square = 0;
            for (let i = 1; i < this.apexes.length - 1; i++) {
                square += this.getTriangleSquare(apex0, this.apexes[i], this.apexes[i+1]);
            }
            this.square = square;
        }

        this.logger.debug(`Polygon: adding new apex #${this.apexes.length}, SELF SQUARE = ${this.square}`);
    }


    // метод определения того, попала ли точно в заданный многоугольник - это тоже отдельная задача
    // решается так: искомая точка образует треугольник с каждым из ребер многоугольника
    // необходимо посчитать площадь каждого такого треугольника и сложить их
    // если суммарная площадь равна собственной площади многоугольника (площади равны), значит точка лежит внутри
    // если площадь больше, значит точка лежит вне многоугольника
    // так будем выполняеть проверку на то, находится ли координата внутри многоугольника
    //
    protected isInPolygon(coord: Coord): boolean {
        if (this.square === 0) throw new Error("self square is 0");

        let squareNew = 0;
        for (let i = 0; i < this.apexes.length - 1; i++) {
            squareNew += this.getTriangleSquare(coord, this.apexes[i], this.apexes[i+1]);
        }
        squareNew += this.getTriangleSquare(coord, this.apexes[this.apexes.length - 1], this.apexes[0]);

        return this.square.toFixed(3) === squareNew.toFixed(3) ? true : false;
    }


    // площадь треугольника по трем координатам считается по формуле Герона
    // сначала по координатам определяются длины всех сторон, а потом просто подставляются в формулу
    //
    private getTriangleSquare(apex0: Coord, apex1: Coord, apex2: Coord): number {
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



export class Portal extends Polygon {
    private queue: number[] = [];


    constructor(logger: winston.Logger) {
        super(logger);
    }


    // портал содержит очередь автомобилей
    // каждое авто при перемещении на новую координату должно проверяться на то, находится ли в портале
    //  - если авто в площади портала, то его необходимо добавить в очередь (если оно еще не там)
    //  - если авто покинуло портал, то его необходимо убрать из очереди
    public checkCarLocation(carId: number, coord: Coord): void {
        let message = `#${carId} [${coord.x}, ${coord.y}] - `;
        if (this.isInPolygon(coord)) {
            if (!this.queue.includes(carId)) {
                this.queue.push(carId);
                message += `IS IN PORTAL (added to teleport queue)`;
            } else
                message += "IS IN PORTAL (no change in queue, already there)";
        } else {
            if (this.queue.includes(carId)) {
                this.queue.splice(this.queue.indexOf(carId), 1);
                message += `LEFT PORTAL (removed from queue)`;
            } else
                message += "OUTSIDE"
        }
        this.logger.info(message);
    }


    // в момент открытия портала самая рано попавшая машина телепортируется (удаляется из очереди)
    //
    public openPortal(): number {
        if (this.queue.length > 0) {
            let teleportedCarId = this.queue.shift();
            this.logger.info(`portal opened: #${teleportedCarId} HAS BEEN TELEPORTED`);
            return teleportedCarId;
        } else {
            this.logger.info("portal opened: no cars in queue");
            return 0;
        }
    }
}
