

function rand(min, max){return Math.floor(Math.random() * (max - min) + min)}

class Canvas {
    constructor(elem) {
        this.elem = document.querySelector(elem);
        this.cc = this.elem.getContext('2d');
        this.cc.imageSmoothingEnabled = false;

        this.win = {
            w: window.innerWidth,
            h: window.innerHeight,
        };
        this.margin = 100;
        this.w = this.elem.style.width = `${this.win.w - this.margin}px`;
        this.h = this.elem.style.height = `${this.win.h - this.margin}px`;
        
        this.resize();
        this.elem.width  = this.w = this.elem.offsetWidth;
        this.elem.height = this.h = this.elem.offsetHeight;
        window.addEventListener('resize', e => this.resize(e));
    }
    resize(e) {
        this.win = {
            w: window.innerWidth,
            h: window.innerHeight,
        };
        this.w = this.elem.style.width = `${this.win.w - this.margin}px`;
        this.h = this.elem.style.height = `${this.win.h - this.margin}px`;
        
        // От ширины
        if (this.win.w < this.win.h) { this.elem.style.width = `${this.win.w - this.margin * 2}px` }
        else { this.elem.style.width = `${this.win.h - this.margin * 2}px`}
        // От высоты
        if (this.win.h < this.win.w) { this.elem.style.height = `${this.win.h - this.margin * 2}px` }
        else { this.elem.style.height = `${this.win.w - this.margin * 2}px`}
        this.elem.width  = this.w = this.elem.offsetWidth;
        this.elem.height = this.h = this.elem.offsetHeight;
    }
}

class DrawLine {
    constructor(cc, x1, y1, x2, y2){
        this.lineWidth = 1;
        cc.beginPath();
        cc.strokeStyle = '#1A8000';
        cc.moveTo(x1, y1);
        cc.lineTo(x2, y2);
        cc.closePath();
        cc.stroke();
    }
}

class Cells {
    constructor(game) {
        this.game = game;
        this.count = this.game.cellCount;
        this.size = this.game.cellSize;
    }

    update(cc){
        this.size = this.game.cellSize;
        
        for(let x = 1; x < this.count; x++){
            new DrawLine(cc, x * this.size, 0, x * this.size, this.game.w);
        }

        for(let y = 1; y < this.count; y++){
            new DrawLine(cc, 0, y * this.size, this.game.w, y * this.size);
        }
    }
}

class Block {
    constructor(game){
        this.game = game;
        this.count = this.game.cellCount;
        this.size = this.game.cellSize;
        this.hue = 1;
        this.color = `hsl(${this.hue}, 100%, 50%)`;
        this.stroke = `hsl(${this.hue}, 100%, 36%)`;
        this.x = 0;
        this.y = 0;
        this.sx = 0;
        this.xy = 0;
        this.resize();
    }

    resize(){
        this.size = this.game.cellSize;
        this.sx = Math.ceil(this.x * this.size);
        this.sy = Math.ceil(this.y * this.size);
        return this;
    }
    
    update(cc){
        this.resize();
        cc.save();
        cc.fillStyle = this.color;
        cc.strokeStyle = this.stroke;
        cc.lineWidth = 3;
        cc.fillRect(this.sx, this.sy, this.size, this.size);
        cc.strokeRect(this.sx, this.sy, this.size, this.size);
        cc.restore();
        return this;
    }
}

class Food extends Block {
    constructor(game){
        super(game);
        this.hue = 56;
        this.color = `hsl(${this.hue}, 100%, 50%)`;
        this.stroke = `hsl(${this.hue}, 100%, 36%)`;
        this.spawn();
    }

    spawn(){
        this.x = Math.floor(rand(0, this.count));
        this.y = Math.floor(rand(0, this.count));
        this.logic();
    }

    logic(){
        // Если еда расположилась на змейке
        this.game.snake.body.forEach(item => {
            if(
                item.x == this.x
                && item.y == this.y
            ){ this.spawn() }
        });
    }

    reset(){ this.spawn() }
}

class SnakeBody extends Block {
    constructor(game, coords){
        super(game);
        this.coords = coords;
        this.hue = 107;
        this.color = `hsl(${this.hue}, 100%, 80%)`;
        this.stroke = `hsl(${this.hue}, 100%, 40%)`;
        this.x = this.coords.x;
        this.y = this.coords.y;
    }
}

class Snake {
    constructor(game){
        this.game = game;
        this.isReady = false;
        this.reset();
        this.frame = 1;
        this.headPosition = this.body[0].coords; // Голова
        this.tailPosition = this.body[ this.body.length-1 ].coords; // Хвост
        this.length = this.body.length;
        this.x = this.headPosition.x;
        this.y = this.headPosition.y;
    }

    update(cc){
        this.logic();
        // Обновляется змейка
        this.body.forEach(item => { item.update(cc) });
    }

    reset(){
        this.tick = 15;
        this.body = [
            new SnakeBody(this.game, {x: 2, y: 0}),
            new SnakeBody(this.game, {x: 1, y: 0}),
            new SnakeBody(this.game, {x: 0, y: 0}),
        ];
        this.direction = 'right';
    }

    ready(){
        this.frame = 1;
        this.game.shadowbox.setMessage({text: 'Пробел - НАЧАТЬ!', size: 60}).show();
    }

    pause(){
        this.frame = 1;
        this.game.isGamePause = true;
        this.game.shadowbox.setMessage({text: 'Пауза', size: 50}).show();
    }

    gameover(){
        this.frame = 1;
        this.game.isGameOver = true;
        this.game.shadowbox.setMessage({text: 'Конец игры! Жми пробел', size: 50}).show();
    }

    directionsHandler(){
        switch(this.direction){
            case 'up':
                this.moveUp();
                break;
            case 'right':
                this.moveRight();
                break;
            case 'down':
                this.moveDown();
                break;
            case 'left':
                this.moveLeft();
                break;
        }
    }
    // Иду вверх
    moveUp(){
        let {x, y} = this.headPosition;
        this.body.unshift(new SnakeBody(this.game, {x: x , y: y - 1}));
        this.body.pop();
    }
    // Иду на право
    moveRight(){
        let {x, y} = this.headPosition;
        this.body.unshift(new SnakeBody(this.game, {x: x + 1, y: y}));
        this.body.pop();
    }
    // Иду вниз
    moveDown(){
        let {x, y} = this.headPosition;
        this.body.unshift(new SnakeBody(this.game, {x: x, y: y + 1}));
        this.body.pop();
    }
    // Иду на лево
    moveLeft(){
        let {x, y} = this.headPosition;
        this.body.unshift(new SnakeBody(this.game, {x: x - 1, y: y}));
        this.body.pop();
    }

    logic(){
        this.frame++;
        this.headPosition = this.body[0].coords; // Где голова сейчас?
        this.tailPosition = this.body[ this.body.length-1 ].coords; // Где хвост сейчас?
        this.isTick = (this.frame % this.tick === 0) ? true : false; // Шаг обновления        
        // Нельзя двигаться против
        if(this.direction == 'up' && this.game.controlls.keyStore.KeyS){return}
        if(this.direction == 'right' && this.game.controlls.keyStore.KeyA){return}
        if(this.direction == 'down' && this.game.controlls.keyStore.KeyW){return}
        if(this.direction == 'left' && this.game.controlls.keyStore.KeyD){return}
        // УПРАВЛЕНИЕ
        if(this.game.controlls.keyStore.KeyW){this.direction = 'up'}
        if(this.game.controlls.keyStore.KeyD){this.direction = 'right'}
        if(this.game.controlls.keyStore.KeyS){this.direction = 'down'}
        if(this.game.controlls.keyStore.KeyA){this.direction = 'left'}
        // ИГРА НА ПАУЗЕ. Сброс кадров
        if(
            this.game.controlls.keySwich.Space
            && !this.game.isGamePause
            && !this.game.isGameOver
        ){
            this.pause();
            this.game.isGamePause = false;
        }
        // ИГРА ЗАВЕРШЕНА
        if(
            this.game.controlls.keyStore.Space
            && this.game.isGameOver
        ){
            this.game.isGameOver = false;
            this.game.controlls.keySwich.Space = false;
            this.game.reset();
        }
        // Первый запуск игры, экран готовности
        if(!this.isReady){ this.ready() }
        if(this.game.controlls.keyStore.Space && !this.isReady){
            this.isReady = true;
            this.game.controlls.keySwich.Space = false;
        }
        // Скорость или шаг движения
        if(this.isTick){this.directionsHandler()}
        // Змейка ест и растёт
        if(
            this.headPosition.x == this.game.food.x
            && this.headPosition.y == this.game.food.y
        ){
            this.game.food.spawn();
            this.body.push( new SnakeBody(this.game, {x: this.tailPosition.x, y: this.tailPosition.y}) );
        }
        // Столкновение головы с телом
        this.body.forEach((item, index) => {
            if(
                index > 0
                && this.body[0].x == item.x
                && this.body[0].y == item.y
            ){
                this.gameover();
            }
        });
        // Столкновение с границами
        if(
            this.headPosition.x < 0
            || this.headPosition.y < 0
            || this.headPosition.x >= this.game.cellCount
            || this.headPosition.y >= this.game.cellCount
        ){
            this.gameover();
        }
    }
}

class DrawText {
    constructor(game){
        this.game = game;
        this.cc = this.game.scene.cc;
        this.text = 'Serenq';
        this.color = '#FFEE00';
        this.size = 30;
        this.align = 'center';
        this.x = this.game.w / 2;
        this.y = this.game.h / 2;
    }

    draw(obj){
        let props = {...obj};
        this.cc.font = `${props.size || this.size}px monospace`;
        this.cc.textAlign = props.align || this.align;
        this.cc.fillStyle = props.color || this.color;
        this.cc.fillText(props.text || this.text, props.x || this.x, props.y || this.y);
        return this;
    }
}

class ShadowBox {
    constructor(game){
        this.game = game;
        this.messageObj = {};
        this.color = 'hsla(0, 0%, 0%, 33%)';
        this.isVisible = false;
        this.drawtext = new DrawText(this.game);
    }

    update(cc){
        this.logic();
        if(!this.isVisible){return}
        // Отрисовка
        cc.save();
        cc.fillStyle = this.color;
        cc.fillRect(0, 0, this.game.scene.w, this.game.scene.h);
        this.drawtext.draw(this.messageObj);
        cc.restore();
        return this;
    }

    setMessage(obj){
        this.messageObj = obj;
        return this;
    }

    show(){
        this.isVisible = true;
        return this;
    }
    hide(){
        this.isVisible = false;
        return this;
    }

    logic(){
        if(this.game.controlls.keyStore.Space && this.isVisible){ this.hide() }
    }
}

class Controlls {
    constructor(game){
        this.game = game;
        this.htmlkeys = new HTMLKeys();
        this.key = ['KeyW','KeyA','KeyS','KeyD','Space'];
        this.keyStore = {};
        this.keySwich = {'Space': false};
        window.addEventListener('keydown', e => this.keyHandler(e));
        window.addEventListener('keyup', e => this.keyHandler(e));
    }
    keyHandler(e){
        if(!this.key.includes(e.code)){return}
        this.keyStore[e.code] = (e.type === 'keydown' && !e.repeat) ? true : false;
        if(e.type === 'keydown' && !e.repeat){this.keySwich[e.code] = !this.keySwich[e.code]}
        (e.type === 'keydown') ? this.htmlkeys.addClass(e.code) : this.htmlkeys.removeClass();
    }
}

class HTMLKeys {
    constructor(keyCode){
        this.keys = document.querySelectorAll('.controlls_item');
        this.name = {'KeyW': 'key_w', 'KeyA': 'key_a', 'KeyS': 'key_s', 'KeyD': 'key_d', 'Space': 'key_space'}
    }

    addClass(keyCode){
        let key = this.name[keyCode];
        this.keys.forEach(item => {
            item.classList.contains(key) ? item.classList.add('active') : false;
        });
    }
    removeClass(){
        this.keys.forEach(item => item.classList.remove('active'))
    }
}

class Game {
    constructor(){
        this.scene = new Canvas('#canvas1');
        // Свойства
        this.w = this.scene.w;
        this.h = this.scene.h;
        this.cellCount = 10;
        this.cellSize = this.w / this.cellCount;
        this.isGameOver = false;
        this.isGamePause = false;
        // Игровые элементы
        this.block = new Block(this);
        this.controlls = new Controlls(this);
        this.cells = new Cells(this, this.cellCount);
        this.snake = new Snake(this);
        this.food = new Food(this);
        this.shadowbox = new ShadowBox(this);
        
        this.drawItems = [
            this.cells,
            this.food,
            this.snake,
            this.shadowbox,
        ];

        this.render();
        console.log(`%c"Змейка" by Serenq / 4 сент 2024`, "color: #ace600; font-style: italic; background-color: #444; padding: 0 20px");
    }

    render(){
        // Обновление данных
        this.w = this.scene.w;
        this.h = this.scene.h;
        this.cellSize = this.w / this.cellCount;        
        // Отрисовка канваса
        this.scene.cc.clearRect(0, 0, this.w, this.h);
        this.drawItems.forEach(item => item.update(this.scene.cc));
        // Цикл анимации
        requestAnimationFrame(() => this.render());
    }

    reset(){
        this.snake.reset();
        this.food.reset();
    }
}

window.addEventListener('DOMContentLoaded', function (){
    const scene = new Game();
});