const period = 10; // период главного цикла
const spd_lvl = [0.75, 0.8, 0.9, 1]; //0.75, 0.8, 0.9, 1]
const attackDistCoef = 0.8; // коэффициент расстояние между центральнми точками героев, при котором засчитывается хит во время атаки
const attackSpeedAnimCoef = 1.5; // коэффициент скорости атаки (во сколько скорость атаки быстрее скорости остальной анимации) 
const spd_koef_default = 1;
let spd_koef2_default = spd_lvl[0];
const move_speed_default = 10;
const lightRestoreTimeDefault = 1000; // время на восстановление заряда, мс
const help = document.querySelector(".help");
const tooltip = document.querySelector(".tooltip");
const light1 = document.querySelector(".light1");
const light2 = document.querySelector(".light2");
const light3 = document.querySelector(".light3");
const other = document.querySelector(".other");

/* ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ */
let w_size = {w: window.innerWidth, h: window.innerHeight}; // размеры окна браузера
let dir = {u : 0, d : 0, l : 0, r : 0}, 		// направление left 37, up 38, right 39, down 40
    attack = 0, fst_att = 0, 					// атака
    catch_trig = 0;								// триггер пересечения перонажей
let player_st = 'idle', player_st2 = 'idle', 	// состояние персонажа для анимации
    last_direction = 1, last_direction2 = 1, 	// последнее направление движения 0 = влево, 1 = вправо (для правильной анимации)
    player2_direction,                          // направление движения маленького пикачу
    player_sprite_x = 0, player_sprite_y = 0, 			// номера кадров большого пикачу
    player2_sprite_x = 0, player2_sprite_y = 0,			// номера кадров маленького пикачу
    drug_st_x = 3, drug_st_y = 0, 				// номера кадров объект
    lighting_x = 0;								// номера кадров молнии
    wall_teleport_1 = 0, wall_teleport_2 = 1; 	// возможность телепортации на границе 
let motion = 0, motion2 = 0,		            // счётчик (переход на следующий кадр когда motion > move_speed)
    move_speed, move_speed2,  		            // скорость анимации (по уолчанию для idle)
    spd_koef = spd_koef_default,				// скорость большого пикачу
    spd_koef2,							        // скорость маленького пикачу
    sprint_bonus_koef_1 = 2.2,                  // коэффициент скорости большого пикачу
    sprint_bonus_koef_2 = 2;                    // коэффициент скорости маленького пикачу
let k_size = 0.8, 								// размер маленького пикачу относительно большого
    pl_size = w_size.h / 6.5, pl2_size = pl_size * k_size,                  // размеры персонажа 
    drug_size = pl2_size; 						// размер объект
let pl_x = 100, pl_y = 50, pl2_x = w_size.w / 2 - (pl2_size / 2), pl2_y = w_size.h / 2 - (pl2_size / 2); // координаты персонажа 
let step_size = w_size.h * 0.0035; 				// шаг персонажа
let timer_1 = 0, timer_2 = 0, timer_3 = 0, timer_4 = 0, timer_5 = 0, timer_6 = 0; 		// счётчики
let timer_anim_1 = 0, timer_anim_2 = 0; 
let changeDirectionTime = 500;                  // время, по истечению которго измениться направление движения нарка (каждый раз случайное)
let lightRestoreTime = lightRestoreTimeDefault; // время на восстановление заряда, мс
let controlMode = 0;                            // режим управления 0 - случайный выбор направления, 1 - следования к точке
let enableBonusActiveTrack = 1;                 // разрешение на сбор бонусов для нарка
let isNextLevel = 0;                            // для обработки нажатия Enter единожды при смене уровня

let bonus = { // БОНУС
    x: 0, 
    y: 0, 
    type: 0, 
    live_t: 6500, //5000
    effect_t: 8000, //6500 
    visible: 0,
    respawn_t: 0, // назначается случайно из диапазона [effect_t * 0.5 ... effect_t * 2]
    sprite: 0,
    sprite_count: 0,
    size_init: 0,
    active: 0,
    person: 0, // 0 - игрок (доктор), 1 - нарк
};

let lightsCount = 3;                            // количество зарядов
let drug_count = 15; 							// количество объектов на уровне
let drug_arr_x = [], drug_arr_y = [], 			// массивы с координатами спавна объекта
    drug_arr_state = []; 						// состояния для каждого объекта
let therapy = 0, addiction = 0;					// состояние лечения и зависимости
let shock_therapy_count = 15;					// коsличество шоковых терапий до излечения
let level = 1;									// уровень игры (1..4)
let Game_mode = 0; 								// состояние игры: 0 - начальный экран, 1 - игра запущена, 2 - пауза, 3 - победа, 4 - проигрыш
let switch_trig = 0;							// для клавиши Esc
let welcome_song_trig = 0;						// для воспроизведения приветствия
let shock_st = 0;								// для анимации молнии
let song_st_drugs = 0, song_st_pain = 0;		// для вывода аудио таблички
let first_time_game = 0;                        // если первый запуск (для одноразовой отрисовки)
let statistics;                                 // показатели лечения/зависимости
let indexOfPlayedAudio = 0;                     // индекс проигрываемого аудио
//#region РЕСУРСЫ
/* звуки */
let attack_0 = new Audio();	attack_0.src = 'audio/attack_0.mp3';
let attack_1 = new Audio();	attack_1.src = 'audio/attack_1.mp3';
let attack_2 = new Audio();	attack_2.src = 'audio/attack_2.mp3';
let pain_0 = new Audio(); pain_0.src = 'audio/pain_0.mp3';
let pain_1 = new Audio(); pain_1.src = 'audio/pain_1.mp3';
let drugs_0 = new Audio(); drugs_0.src = 'audio/drugs_0.mp3';
let welcome = new Audio(); welcome.src = 'audio/welcome.mp3';
let win = new Audio(); win.src = 'audio/win.mp3';
let lose = new Audio(); lose.src = 'audio/lose.mp3';
let finish = new Audio(); finish.src = 'audio/finish.mp3';
let die_mf = new Audio(); die_mf.src = 'audio/DieMF.mp3';
let decadence = new Audio(); decadence.src = 'audio/Decadence.mp3';
let heh = new Audio(); heh.src = 'audio/heh.mp3';
let laugh = new Audio(); laugh.src = 'audio/laugh.mp3';
/* картинки */
let pic0 = new Image();
pic0.src = 'bitmaps/newgame.png';
let pic = new Image();              
pic.src = 'bitmaps/player_2.png';  		// спрайт персонажа
let pic2 = new Image();				        // пикча с дурью, оаоа... ммм))
pic2.src = 'bitmaps/drags.png';
let pic3 = new Image();				        // пикча с тенью
pic3.src = 'bitmaps/shadow.png'; 
let pic4 = new Image();
pic4.src = 'bitmaps/next_stage.png';
let pic5 = new Image();
pic5.src = 'bitmaps/freedom.png';
let pic6 = new Image();				        // пикча с клавишами
pic6.src = 'bitmaps/keys.png';
let pic7 = new Image(); 			        // пикча с молнией
pic7.src = 'bitmaps/lighting_0.png';
let pic8 = new Image(); 			        // значёк звука
pic8.src = 'bitmaps/zvuk_drugs.png';
let pic9 = new Image(); 			        // значёк звука
pic9.src = 'bitmaps/zvuk_pain.png';
let pic10 = new Image(); 			        // спрайт санитара
pic10.src = 'bitmaps/player.png';
let pic11 = new Image();
pic11.src = 'bitmaps/gameover.png';
let pic12 = new Image();
pic12.src = 'bitmaps/bonuses/energy_red(182x182)8.png'; // бонус скорость
let pic13 = new Image();
pic13.src = 'bitmaps/bonuses/energy_blue(182x182)8.png'; // бонус телепорт
let pic14 = new Image();
pic14.src = 'bitmaps/bonuses/fire_red(128x128)31.png'; // визуализация активности бонуса "скорость"
let pic15 = new Image();
pic15.src = 'bitmaps/bonuses/teleport(192x192)20.png'; // визуализация активности бонуса "телепорт"
// размеры канваса //
canvas.width = w_size.w * 0.999;
canvas.height = w_size.h * 0.8;


/* РАНДОМАЙЗЕР */ 
function randomInteger(min, max) { // случайное число от min до (max+1)			  
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}		

/* СПАВНЕР НАРКОТЫ */ 
function drugSpawn() { // задаём координаты спавна объекта		
    for (var i = 0; i < drug_count; i++) {
        drug_arr_state[i] = 1; // заполнение массива единицами 
        let checked = 0; // результат проверки
        let padding = drug_size; // минимальный отступ между объектами
        // присваиваем случайные координаты
        
        while (!checked) {
            drug_arr_x[i] = randomInteger(0, canvas.width - drug_size); 
            drug_arr_y[i] = randomInteger(0, canvas.height - drug_size);
            checked = 1; 
            // проверка координат около нарка
            let distance = calculateDistance(drug_arr_x[i], drug_arr_y[i], pl2_x, pl2_y);
            if (distance < padding) checked = 0;   
            // проверка координат около созданных объектов
            for (var j = 0; j < i; j++) {
                if (i != j) distance = calculateDistance(drug_arr_x[i], drug_arr_y[i], drug_arr_x[j], drug_arr_y[j]);
                if (distance < padding) {
                    checked = 0; 
                    break;
                }
            }               
        }      
    }
}

function catch_and_shock() {
    therapy++;
    pain = randomInteger(0,1);
    pain == 0 ? pain_0.play() : pain_1.play();
    shock_st = 1; setTimeout(function () { shock_st = 0; }, 500);
    stat(); // вывод статистики
    if (therapy == shock_therapy_count || therapy > shock_therapy_count) {
        Game_mode = 3; // ПОБЕДА
        level++; // следующий уровень
        level < 5 ? setTimeout(function () { win.play(); }, 500) : setTimeout(function () { finish.play(); }, 500);
    }
}

function complete_addiction() {
    Game_mode = 4; // ПРОИГРЫШ
    setTimeout(function () { lose.play(); }, 200);
}

function stat() {
    therapy_width = w_size.w*0.155*therapy/shock_therapy_count;
    statistics = document.querySelector(".statistics");
    statistics.innerHTML = '<img title = "ЛЕЧЕНИЕ" style = "position: absolute; top:'+(w_size.h*0.825)+'px; left: '+w_size.w*0.778+'px;width:'+w_size.w*0.05+'px; height:'+w_size.w*0.025+'px;" src = "bitmaps/therapy.png">';
    statistics.innerHTML += '<div class = "therapy" style = "border-color: #2ECCFA; top:'+(w_size.h*0.822)+'px; left: '+(w_size.w*0.75+w_size.w*0.08)+'px; width:'+therapy_width+'px; height:'+w_size.w*0.025+'px; background: #2ECCFA;"></div>'
    statistics.innerHTML += '<div title = "ЛЕЧЕНИЕ" class = "therapy" style = "top:'+(w_size.h*0.822)+'px; left: '+(w_size.w*0.75+w_size.w*0.08)+'px; width:'+w_size.w*0.15+'px; height:'+w_size.w*0.025+'px;">'+therapy+'/'+shock_therapy_count+'</div>'
    addiction_width = w_size.w*0.155*addiction/drug_count;
    statistics.innerHTML += '<img title = "ЗАВИСИМОСТЬ" style = "position: absolute; top:'+(w_size.h*0.905)+'px; left: '+w_size.w*0.8+'px;width:'+w_size.w*0.025+'px; height:'+w_size.w*0.025+'px;" src = "bitmaps/addiction.png">';
    statistics.innerHTML += '<div class = "addiction" style = "border-color: #FE2EF7; top:'+(w_size.h*0.9)+'px; left: '+(w_size.w*0.75+w_size.w*0.08)+'px; width:'+addiction_width+'px; height:'+w_size.w*0.025+'px; background: #FE2EF7;"></div>';
    statistics.innerHTML += '<div title = "ЗАВИСИМОСТЬ" class = "addiction" style = "top:'+(w_size.h*0.9)+'px; left: '+(w_size.w*0.75+w_size.w*0.08)+'px; width:'+w_size.w*0.15+'px; height:'+w_size.w*0.025+'px;">'+addiction+'/'+drug_count+'</div>';
}

function bonusEffect(state, person) {
    timer_3 = 0; // сброс счётчика времени появления очередого бонуса 
    bonus.active = state; // активность бонуса
    bonus.person = person; // кто собрал бонус (0 - игрок, 1 - нарк)
    if (person == 0) { // персонаж - доктор (игрок)
        if (bonus.active) {
            switch (bonus.type) {
            case 0: // телепорт
                wall_teleport_1 = 1;
                heh.play();
                break;
            case 1: // скорость
                spd_koef *= sprint_bonus_koef_1;
                lightRestoreTime /= 2;
                die_mf.play();
                break;
            }
        }
        else { // сброс действия бонусов
            spd_koef = spd_koef_default; // скорость персонажа по умолчанию        
            lightRestoreTime = lightRestoreTimeDefault; // скорость восстановления зарядов по умолчанию
            wall_teleport_1 = 0; // отключаем телепорт
        }
    }
    else { // персонаж - нарк
        if (bonus.active) {
            switch (bonus.type) {
            case 0: // пока нету
                controlMode = 1; // вкл. режима управления следования к точке
                laugh.play();
                break;
            case 1: // скорость
                spd_koef2 *= sprint_bonus_koef_2;
                decadence.play();
                break;
            }
        }
        else { // сброс действия бонусов
            spd_koef2 = spd_koef2_default; // скорость персонажа по умолчанию   
            controlMode = 0; // выкл. режима управления следования к точке
        }
    }
    
}

function Collision() {
    // проверка на столкновение с бонусом
    if (bonus.visible == 1) {
        // для игрока
        let distanse = calculateDistance(pl_x, pl_y, bonus.x, bonus.y);
        if ((pl_size * attackDistCoef - distanse) > 0) {
            bonus.visible = 0; // убираем бонус с уровня
            bonusEffect(1, 0);
            // ДОДЕЛАТЬ! ПЕРЕДЕЛАТЬ ТАЙМЕР НА АССИНХРОННЫЙ
            setTimeout( () => {
                bonusEffect(0, 0);
            }, bonus.effect_t);
        }
        // для нарка
        distanse = calculateDistance(pl2_x, pl2_y, bonus.x, bonus.y);
        if ((pl_size * attackDistCoef - distanse) > 0) {
            bonus.visible = 0; // убираем бонус с уровня
            bonusEffect(1, 1);
            setTimeout( () => {
                bonusEffect(0, 1);
            }, bonus.effect_t);
        }
        
    }
    // проверка на столкновение персонажей
    distanse = calculateDistance(pl_x, pl_y, pl2_x, pl2_y);
    if ((pl_size * attackDistCoef - distanse) > 0) {
        catch_trig = 1;
    }
    else {
        catch_trig = 0;
    }

    // проверка на столкновение с наркотиками
    let collision_count = 0;
    for (var i = 0; i < drug_arr_state.length; i++) {
        x = drug_arr_x[i] + drug_size/2;
        y = drug_arr_y[i] + drug_size/2;
        if ((x > pl2_x && x < pl2_x + pl2_size) && (y > pl2_y && y < pl2_y + pl2_size)) {
            if (drug_arr_state[i] == 1) drugs_0.play();
            drug_arr_state[i] = 0;
        }
        if (drug_arr_state[i] == 0) {
            collision_count++;
            addiction = collision_count;
            stat(); // вывод статистики
            if (collision_count == drug_count) complete_addiction(); // СРАБАТЫВАЕТ КОГДА МЕЛКИЙ СОБРАЛ ВСЕ ПРЕДМЕТЫ
        }							
    }
}

function changeLevel() { // установка начальных значений для каждого уровня
    isNextLevel = 0;
    Game_mode = 1;
    spd_koef2_default = spd_lvl[level-1];
    spd_koef2 = spd_koef2_default;
    switch (level) {
        case 1: drug_st_x = 3; drug_count = 12; shock_therapy_count = 12;  
            help.setAttribute("data-help", "Афганка — конопля, выращеная и привезённая из Афганистана.");
            break;
        case 2: drug_st_x = 2; drug_count = 16; shock_therapy_count = 16; 
            help.setAttribute("data-help", "Мефедрон - фармакологический (аптечный) препарат, применяемый наркоманами в качестве наркотиков.");
            break;
        case 3: drug_st_x = 1; drug_count = 18; shock_therapy_count = 18; 
            help.setAttribute("data-help", "Колеса — наркотик в таблетках (чаще всего экстази).");
            break;
        case 4: drug_st_x = 0; drug_count = 24; shock_therapy_count = 20; 
            help.setAttribute("data-help", "Ши́рка — наркотик для внутривенного употребления.");
            break;
    }	
    other.innerHTML = "";
    setTimeout( () => { // ОБЛАЧКО С ИКОНКОЙ ТЕКУЩЕЙ НАРКОТЫ
        other.innerHTML = 
        `<div class = "  bounce_anim" style = "position: absolute; left: ${w_size.w*0.03}px; top:${w_size.h*0.65}px; height:${w_size.h*0.15}px">
        <img class="arrow_mini" src = "bitmaps/arrow_mini.png" width = ${w_size.h*0.2} height = ${w_size.h*0.2}>
        <div class = "viewport">
        <img class="clipped pic_drug" src = ${pic2.src} width = ${w_size.h*0.4} height = ${w_size.h*0.2}>
        </div></div>`;
        let viewport_div = document.querySelector(".viewport");
        let arrow_mini = document.querySelector(".arrow_mini");
        viewport_div.style.left = `${arrow_mini.clientWidth*0.25}px`;
        viewport_div.style.top = `${-arrow_mini.clientHeight*0.85}px`;
        bias_size = w_size.h*0.1;
        setViewport(document.querySelector(".pic_drug"), bias_size*(4-level), 0, bias_size, bias_size);
    }, 800);
    setTimeout( () => {
        other.innerHTML = "";
    }, 4800);
    therapy = 0;
    addiction = 0;
    drugSpawn();
    stat(); // вывод статистики
    pl_x = 100, pl_y = 50, pl2_x = w_size.w / 2 - (pl2_size / 2), pl2_y = w_size.h / 2 - (pl2_size / 2); // восстанавливаем стандартные координаты игроков
}
function setViewport(img, x, y, width, height) { // для разрезания текстур на клипы 
    img.style.left = "-" + x + "px";
    img.style.top  = "-" + y + "px";
    if (width !== undefined) {
        img.parentNode.style.width  = width  + "px";
        img.parentNode.style.height = height + "px";
    }
}
function calculateDistance(x1, y1, x2, y2) { // расстояние между двумя точками
    return distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function lights() { // заряды
    if (Game_mode == 0 || Game_mode == 3 || Game_mode == 4) {
        light1.style.display = "none";
        light2.style.display = "none";
        light3.style.display = "none";
    }
    else {

        if (Game_mode == 1 && attack == 0) { // восстановление зарядов
            if (timer_6++ > (lightRestoreTime / period)) {
                timer_6 = 0;
                if (lightsCount < 3) lightsCount++;
            }
        }
        else timer_6 = 0;

        switch (lightsCount) {
            case 0: 
                light1.style.display = "none";
                light2.style.display = "none";
                light3.style.display = "none";
                break;
            case 1: 
                light1.style.display = "";
                light2.style.display = "none";
                light3.style.display = "none";
                break;                
            case 2: 
                light1.style.display = "";
                light2.style.display = "";
                light3.style.display = "none";
                break;                
            case 3: 
                light1.style.display = "";
                light2.style.display = "";
                light3.style.display = "";
                break;
        }
        
    }
}

/* ГЛАВНЫЙ ЦИКЛ */
document.onload = setInterval(loop, period); 		
function loop() {	
    let canvas = document.getElementById("canvas");
    ctx = canvas.getContext('2d'); 	// контекст
    lights(); // заряды
    if (Game_mode != 0) {
        first_time_game = 0;
    }
    if (Game_mode == 0) { // НАЧАЛО	
        ctx.clearRect(0, 0, canvas.width, canvas.height); // чистим канвас
        ctx.drawImage(pic0, canvas.width*0.15, canvas.height*0.1, canvas.width*0.2, canvas.width*0.3); 
        ctx.drawImage(pic6, canvas.width*0.6, canvas.height*0.3, canvas.width*0.35, canvas.width*0.2);
        ctx.font = ''+canvas.width*0.06+'px "Gunplay"';
        offset = 5;
        ctx.fillStyle = "white";
        ctx.fillText("ГОТОВ?", canvas.width*0.38, canvas.height/2.5+offset);
        ctx.fillStyle = "black";
        ctx.fillText("ГОТОВ?", canvas.width*0.38-offset/1.5, canvas.height/2.5+offset/1.5);
        ctx.font = ''+canvas.width*0.03+'px "Gunplay"';
        ctx.fillStyle = "#FAF315";
        ctx.fillText("жми Enter", canvas.width*0.4+offset, canvas.height/1.7+offset);	
        ctx.fillStyle = "#000";
        ctx.fillText("жми Enter", canvas.width*0.4+offset/1.5, canvas.height/1.7+offset/1.5);
        /* пика в левом нижнем углу */
        if (first_time_game == 0) {
            first_time_game = 1;
            help.setAttribute("data-help", "Если мелкий Пика успеет собрать всю дрянь, то он сдохнет от передоза и ты проиграешь. Чтобы выиграть надо успеть несколько раз ударить торчка током (электрошокерная терапия), тогда его разум очистится и он станет порядочным покемоном.");
            help.style.width = w_size.h*0.3 + "px";
            help.style.height = w_size.h*0.2 + "px";
            other.innerHTML = '<div style = "position: absolute; left: '+w_size.w*0.01+'px; top:'+w_size.h*0.65+'px"><img class="bounce_anim" src = "bitmaps/arrow.png" width = '+w_size.h*0.3+' height = '+w_size.h*0.2+'></div>';
            if (statistics)
                statistics.innerHTML = null;
        }
    }
    else if (Game_mode == 2) { // ПАУЗА					
        offset = 1;
        ctx.strokeStyle = "#15B2AA";					
        ctx.strokeText("ПАУЗА", canvas.width/2-canvas.height*0.25 - offset*2, canvas.height/2 - offset*2);
        ctx.strokeStyle = "#000";	//#5F5				
        ctx.strokeText("ПАУЗА", canvas.width/2-canvas.height*0.25 + offset, canvas.height/2 + offset);			
        ctx.strokeStyle = "#fff";					
        ctx.strokeText("ПАУЗА", canvas.width/2-canvas.height*0.25, canvas.height/2);
    }
    else if (Game_mode == 3) { // ПОБЕДА
        if (level > 4) {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // чистим канвас
            ctx.drawImage(pic5, canvas.width/7, canvas.height/7, canvas.height/10*8, canvas.height/10*8);
            offset = -7;
            ctx.fillStyle = "#46F7FA";
            ctx.font = ''+canvas.height*0.15+'px "Gunplay"';
            ctx.fillText("ПОЗДРАВЛЯЮ!", canvas.width/10+canvas.height/10*7+offset, canvas.height/4+offset);
            ctx.fillStyle = "black";
            ctx.fillText("ПОЗДРАВЛЯЮ!", canvas.width/10+canvas.height/10*7+offset/2, canvas.height/4+offset/1.5);
            ctx.font = ''+canvas.height*0.11+'px "Gunplay"';
            ctx.fillStyle = "#98F813";
            ctx.fillText("Вы избавили друга", canvas.width/10+canvas.height*0.8+offset, canvas.height/1.8+offset);	
            ctx.fillText("от зависимости!", canvas.width/6+canvas.height*0.7+offset, canvas.height/1.4+offset);
            ctx.fillStyle = "#100218";
            ctx.fillText("Вы избавили друга", canvas.width/10+canvas.height*0.8+offset/1.5, canvas.height/1.8+offset/1.5);
            ctx.fillText("от зависимости!", canvas.width/6+canvas.height*0.7+offset/1.5, canvas.height/1.4+offset/1.5);
            help.setAttribute("data-help", "Не, ну ты внатуре красавчик!");
        }
        else { // СЛЕДУЮЩИЙ УРОВЕНЬ
            ctx.clearRect(0, 0, canvas.width, canvas.height); // чистим канвас
            ctx.drawImage(pic4, canvas.width/6, canvas.height/7, canvas.height/10*5.6, canvas.height/10*8);
            offset = -7;
            ctx.fillStyle = "#1AFA2A";
            ctx.font = ''+canvas.height*0.15+'px "Gunplay"';
            ctx.fillText("МОЛОДЕЦ!", canvas.width/10+canvas.height/10*7+offset, canvas.height/2.5+offset);
            ctx.fillStyle = "black";
            ctx.fillText("МОЛОДЕЦ!", canvas.width/10+canvas.height/10*7+offset/2, canvas.height/2.5+offset/1.5);
            ctx.font = ''+canvas.height*0.1+'px "Gunplay"';
            ctx.fillStyle = "#FAF315";
            ctx.fillText("но это ещё не всё...", canvas.width/10+canvas.height/10*8+offset, canvas.height/1.7+offset);	
            ctx.fillStyle = "#100218";
            ctx.fillText("но это ещё не всё...", canvas.width/10+canvas.height/10*8+offset/1.5, canvas.height/1.7+offset/1.5);
        }
    }
    else if (Game_mode == 4) { // ПРОИГРЫШ
        ctx.clearRect(0, 0, canvas.width, canvas.height); // чистим канвас
        ctx.drawImage(pic11, canvas.width/15, canvas.height/10, canvas.height/10*8, canvas.height/10*8);
        offset = -7;
        ctx.fillStyle = "#D00";
        ctx.font = ''+canvas.height*0.15+'px "Gunplay"';
        ctx.fillText("ВЫ ПРОИГРАЛИ", canvas.width/10+canvas.height/10*7+offset, canvas.height/2.5+offset);
        ctx.fillStyle = "black";
        ctx.fillText("ВЫ ПРОИГРАЛИ", canvas.width/10+canvas.height/10*7+offset/2, canvas.height/2.5+offset/1.5);
        ctx.font = ''+canvas.height*0.1+'px "Gunplay"';
        ctx.fillStyle = "#D0D";
        ctx.fillText("Пика сторчался...", canvas.width/10+canvas.height/10*8+offset, canvas.height/1.7+offset);	
        ctx.fillStyle = "#100218";
        ctx.fillText("Пика сторчался...", canvas.width/10+canvas.height/10*8+offset/1.5, canvas.height/1.7+offset/1.5);
        help.setAttribute("data-help", "Сторчаться — дойти до состояния совершенной деградации, вызванной употреблением наркотических веществ.");
    }

    if (Game_mode == 1) { // ИРГОВОЙ ПРОЦЕСС
        /* УПРАВЛЕНИЕ ПЕРСОНАЖЕМ */ 
        move_speed = move_speed_default / spd_koef; // скорость анимации
        if (attack == 1 && lightsCount > 0) {
            if (lightsCount > 0) { // если есть заряды
                if (fst_att == 0) { // для воспроизведения анимации атаки с начала, а не с текущего кадра
                    fst_att = 1; // установка триггера
                    player_sprite_x = 0; // сброс кадра
                }
                move_speed = move_speed_default / spd_koef / attackSpeedAnimCoef; // скорость анимации
                player_st = 'attack';
            }
            else {
                splayer_st = 'idle';
            }
        }
        if (attack == 0) {
            if (dir.l == 1 && dir.u == 0 && dir.d == 0 && dir.r == 0) { // влево
                if (pl_x < 0 - pl_size/4 && wall_teleport_1 == 1)
                    pl_x = canvas.width - pl_size*0.75;
                if (pl_x < 0 - pl_size/4);
                else pl_x -= step_size;

                player_st = 'left';		
                last_direction = 0;
            }
            else if (dir.l == 1 && dir.u == 1 && dir.d == 0 && dir.r == 0) { // влево и вверх
                if (pl_x < 0 - pl_size/4 && wall_teleport_1 == 1)
                    pl_x = canvas.width - pl_size*0.75;
                if (pl_x < 0 - pl_size/4);
                else pl_x -= step_size / 1.414;
                if (pl_y < 0 - pl_size/1.7 && wall_teleport_1 == 1)
                    pl_y = canvas.height - pl_size*0.75;
                if (pl_y < 0 - pl_size/4 && wall_teleport_1 == 0);
                else pl_y -= step_size / 1.414;	
                player_st = 'left';
                last_direction = 0;
            }
            else if (dir.l == 1 && dir.u == 0 && dir.d == 1  && dir.r == 0) { // влево и вниз
                if (pl_x < 0 - pl_size/4 && wall_teleport_1 == 1)
                    pl_x = canvas.width - pl_size*0.75;
                if (pl_x < 0 - pl_size/4);
                else pl_x -= step_size / 1.414;
                if (pl_y > canvas.height - pl_size*0.75 && wall_teleport_1 == 1)
                    pl_y = 0 - pl_size/1.7;
                if (pl_y > canvas.height - pl_size*0.75);
                else pl_y += step_size / 1.414;	
                player_st = 'left';
                last_direction = 0;
            }
            else if (dir.r == 1 && dir.u == 0 && dir.d == 0  && dir.l == 0) { // вправо
                if (pl_x > canvas.width - pl_size*0.75 && wall_teleport_1 == 1)
                    pl_x = 0 - pl_size/4;
                if (pl_x > canvas.width - pl_size*0.75);
                else pl_x += step_size;
                player_st = 'right';
                last_direction = 1;
            } 
            else if (dir.r == 1 && dir.u == 1 && dir.d == 0  && dir.l == 0) { // вправо и вверх
                if (pl_x > canvas.width - pl_size*0.75 && wall_teleport_1 == 1)
                    pl_x = 0 - pl_size/4;
                if (pl_x > canvas.width - pl_size*0.75);
                else pl_x += step_size / 1.414;
                if (pl_y < 0 - pl_size/1.7 && wall_teleport_1 == 1)
                    pl_y = canvas.height - pl_size*0.75;
                if (pl_y < 0 - pl_size/4 && wall_teleport_1 == 0);
                else pl_y -= step_size / 1.414;	
                player_st = 'right';
                last_direction = 1;
            }
            else if (dir.r == 1 && dir.u == 0 && dir.d == 1 && dir.l == 0) { // вправо и вниз
                if (pl_x > canvas.width - pl_size*0.75 && wall_teleport_1 == 1)
                    pl_x = 0 - pl_size/4;
                if (pl_x > canvas.width - pl_size*0.75);
                else pl_x += step_size / 1.414;
                if (pl_y > canvas.height - pl_size*0.75 && wall_teleport_1 == 1)
                    pl_y = 0 - pl_size/1.7;
                if (pl_y > canvas.height - pl_size*0.75);
                else pl_y += step_size / 1.414;	
                player_st = 'right';
                last_direction = 1;
            }
            else {
                player_st = 'idle';	
            }	
        }

        // выбор направления движения нарка
        if (controlMode == 0) { // режим случайного перемещения
            if (timer_1 < changeDirectionTime / period) timer_1++;
            else {
                changeDirectionTime = randomInteger(101, 1000);
                player2_direction = randomInteger(0, 14);
                timer_1 = 0;
            }
        }
        else { // режим поиска пути
            let closestDrugIndex = 0; // индекс самого близкого объекта
            let previousDistance = 0xFFFF;
            for (let i = 0; i < drug_count; i++) {
                if (drug_arr_state[i]) { // проверяем только те объекты, которые не собрали
                    let distance = calculateDistance(pl2_x, pl2_y, drug_arr_x[i], drug_arr_y[i]);
                    if (distance < previousDistance) { // если очередной объект ближе предыдущего
                        previousDistance = distance; // назначаем новую ближайшую дистанцию до объекта
                        closestDrugIndex = i; // запоминаем индекс объекта
                    }
                }                
            }
            // определение направления движения
            if (pl2_x > drug_arr_x[closestDrugIndex]) { // объект слева
                if (pl2_y > drug_arr_y[closestDrugIndex]) { // объект cверху
                    player2_direction = 3;
                }
                else { // объект снизу
                    player2_direction = 4;
                }
            }
            else { // объект справа
                if (pl2_y > drug_arr_y[closestDrugIndex]) { // объект cверху
                    player2_direction = 5;
                }
                else { // объект снизу
                    player2_direction = 6;
                }
            }
        }

        if (enableBonusActiveTrack && bonus.visible == 1) { // режим следования к бонусу
            // определение направления движения к бонусу
            if (pl2_x > bonus.x) { // объект слева
                if (pl2_y > bonus.y) { // объект cверху
                    player2_direction = 3;
                }
                else { // объект снизу
                    player2_direction = 4;
                }
            }
            else { // объект справа
                if (pl2_y > bonus.y) { // объект cверху
                    player2_direction = 5;
                }
                else { // объект снизу
                    player2_direction = 6;
                }
            }
        }

        switch (player2_direction) {
            case 0:
            case 7:
            case 14: player_st2 = "idle"; // стоит
                    break;
            case 1:
            case 8: player_st2 = "left"; // влево								 
                    if (pl2_x < 0 && wall_teleport_2 == 0);
                    else {
                        pl2_x -= step_size * spd_koef2;
                        if (pl2_x < - (pl2_size / 2)) 
                            pl2_x = canvas.width - (pl2_size / 2);
                    } 
                    last_direction2 = 0;
                    break;
            case 2:
            case 9: player_st2 = "right"; // вправо
                    if (pl2_x > canvas.width - pl2_size && wall_teleport_2 == 0);
                    else {
                        pl2_x += step_size * spd_koef2;
                        if (pl2_x > canvas.width - (pl2_size / 2)) 
                            pl2_x = -(pl2_size / 2);
                    }
                    last_direction2 = 0; 
                    break;
            case 3:
            case 10: player_st2 = "left"; // влево вверх
                    if (pl2_x < 0 && wall_teleport_2 == 0);
                    else {
                        pl2_x -= step_size / 1.414 * spd_koef2;
                        if (pl2_x < - (pl2_size / 2)) 
                            pl2_x = canvas.width - (pl2_size / 2);
                    }
                    if (pl2_y < 0 && wall_teleport_2 == 0);
                    else {
                        pl2_y -= step_size / 1.414 * spd_koef2;
                        if (pl2_y < - (pl2_size / 2)) 
                            pl2_y = canvas.height - (pl2_size / 2);
                    }
                    break;
            case 4:
            case 11: player_st2 = "left"; // влево вниз
                    if (pl2_x < 0 && wall_teleport_2 == 0);
                    else {
                        pl2_x -= step_size / 1.414 * spd_koef2;
                        if (pl2_x < - (pl2_size / 2)) 
                            pl2_x = canvas.width - (pl2_size / 2);
                    }
                    if (pl2_y > canvas.height - pl2_size && wall_teleport_2 == 0);
                    else {
                        pl2_y += step_size / 1.414 * spd_koef2;	
                        if (pl2_y > canvas.height - (pl2_size / 2))
                            pl2_y = - (pl2_size / 2);
                    }
                    break;
            case 5:
            case 12: player_st2 = "right"; // вправо вверх
                    if (pl2_x > canvas.width - pl2_size && wall_teleport_2 == 0);
                    else {
                        pl2_x += step_size / 1.414 * spd_koef2;
                        if (pl2_x > canvas.width - (pl2_size/2))
                            pl2_x = - (pl2_size/2);
                    }
                    if (pl2_y < 0 && wall_teleport_2 == 0);
                    else {
                        pl2_y -= step_size / 1.414 * spd_koef2;
                        if (pl2_y < - (pl2_size/2))
                            pl2_y = canvas.height - (pl2_size/2);
                    }
                    break;
            case 6:
            case 13: player_st2 = "right"; // вправо вниз
                    if (pl2_x > canvas.width - pl2_size && wall_teleport_2 == 0);
                    else {
                        pl2_x += step_size / 1.414 * spd_koef2;
                        if (pl2_x > canvas.width - (pl2_size/2))
                            pl2_x = - (pl2_size/2);
                    }
                    if (pl2_y > canvas.height - pl2_size && wall_teleport_2 == 0);
                    else {
                        pl2_y += step_size / 1.414 * spd_koef2;	
                        if (pl2_y > canvas.height - (pl2_size/2))
                            pl2_y = - (pl2_size/2);
                    }
                    break;
        }
        
        Collision(); // проверка столкновений
        
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height); // чистим канвас 
        player_pic_x = 46 * player_sprite_x, player_pic_y = 46 * player_sprite_y; // пересчёт кадры в координаты
        player2_pic_x = 46 * player2_sprite_x, player2_pic_y = 46 * player2_sprite_y;					
        for (var z = 0; z < drug_count; z++) {
            if (drug_arr_state[z] == 1) {
                ctx.drawImage(pic2, drug_st_x * 128, drug_st_y * 128, 128, 128, drug_arr_x[z], drug_arr_y[z], drug_size, drug_size);
            }
        }
        /* проверка воспроизведения звуков и вывод смайлов */
        drugs_0.onplaying = function () {song_st_drugs = 1;}; pain_0.onplaying = function () {song_st_pain = 1;}; pain_1.onplaying = function () {song_st_pain = 1;};
        drugs_0.onended = function () {song_st_drugs = 0;}; pain_0.onended = function () {song_st_pain = 0;}; pain_1.onended = function () {song_st_pain = 0;};
        /* отрисовка остальных игровых спрайтов*/ 
        // СПАВНЕР БОНУСА
        if (timer_3 > (bonus.respawn_t / period)) { // спавн бонуса в случаный момент времени
            timer_3 = 0;
            bonus.x = randomInteger(0, canvas.width - drug_size);
            bonus.y = randomInteger(0, canvas.height - drug_size);
            bonus.type = randomInteger(0, 1); // рандомный бонус
            bonus.visible = 1; // вкл. видимость бонуса
            bonus.respawn_t = randomInteger(bonus.effect_t*0.5, bonus.effect_t*2); // новое время респавна
            setTimeout( () => { // самоуничтожение бонуса
                bonus.visible = 0;
                timer_3 = 0;
            }, bonus.live_t);
        }
        else {
            if (bonus.active || bonus.visible) timer_3 = 0;
            else timer_3++;
        }

        /* АНИМАЦИЯ СПРАЙТОВ ПЕРСОНАЖЕЙ */ 
        // пика доктор
        if (motion < move_speed) motion++;
        else {
            motion = 0; 
            if (timer_anim_1++ > 2) timer_anim_1 = 0; // для замедления анимации "idle" в 2 раза 
            if (player_st == 'idle') { // стоит на месте
                if (timer_anim_1 == 0) {
                    player_sprite_x = randomInteger(0, 6);
                }
                player_sprite_y = last_direction ? 0 : 4; // в зависимости от направления
            }
            if (player_st == 'left' || (player_st == 'up_down' && last_direction == 0)) { // бежит влево
                if (player_sprite_x < 5) player_sprite_x++; else player_sprite_x = 0;
                player_sprite_y = 5;
            }
            if (player_st == 'right' || (player_st == 'up_down' && last_direction == 1)) { // бежит вправо
                if (player_sprite_x < 5) player_sprite_x++; else player_sprite_x = 0;
                player_sprite_y = 1;
            }
            if (player_st == 'attack' && attack) {
                if (player_sprite_x < 5) player_sprite_x++; else player_sprite_x = 0;
                player_sprite_y = last_direction ? 3 : 7; // в зависимости от направления движения
                if (player_sprite_x == 3) {
                    volt = randomInteger(0,2);
                    volt == 0 ? attack_0.play() : volt == 1 ? attack_1.play() : attack_2.play();
                }
                if (player_sprite_x == 4 && lightsCount > 0) {
                    if (catch_trig == 1) catch_and_shock();
                    lightsCount--;
                    if (lightsCount <= 0) attack = 0;
                }
                
            }
        }    

        // анимация нарка
        move_speed2 = move_speed_default * 0.5 / spd_koef2; 
        if (motion2 < move_speed2) motion2++;
        else {
            motion2 = 0; 
            if (timer_anim_2++ > 2) timer_anim_2 = 0; // для замедления анимации "idle" в 2 раза 
            if (player_st2 == 'idle' ) { // стоит на месте
                if (timer_anim_2 == 0) {
                    player2_sprite_x = randomInteger(0, 6);
                }
                player2_sprite_y = last_direction ? 0 : 4; // в зависимости от направления
            }
            if (player_st2 == 'left') { // бежит влево
                if (player2_sprite_x < 5) player2_sprite_x++; else player2_sprite_x = 0;
                player2_sprite_y = 5;
            }
            if (player_st2 == 'right') { // бежит вправо
                if (player2_sprite_x < 5) player2_sprite_x++; else player2_sprite_x = 0;
                player2_sprite_y = 1;
            }
        }
        

        ctx.drawImage(pic3, pl2_x, pl2_y+pl2_size*0.62, pl2_size, pl2_size/2); // тень маленького пикачу
        ctx.drawImage(pic3, pl_x, pl_y+pl_size*0.62, pl_size, pl_size/2); // тень большого пикачу
        ctx.drawImage(pic, player2_pic_x, player2_pic_y, 46, 46, pl2_x, pl2_y, pl2_size, pl2_size); // маленький пикачу
        if (shock_st == 1) {
            if (timer_2 < 50) timer_2++;
            else lighting_x < 750 ? lighting_x += 250 : lighting_x = 0;
            ctx.drawImage(pic7, 0, 0, lighting_x, 250, pl2_x-pl2_size/4, pl2_y-pl2_size/4, pl2_size*1.5, pl2_size*1.5); // молния		
        }
        if (song_st_drugs == 1) ctx.drawImage(pic8, pl2_x+pl2_size/4, pl2_y, pl2_size/2, pl2_size/2); // значёк звука над маленьким персонажем
        if (song_st_pain == 1) ctx.drawImage(pic9, pl2_x+pl2_size/4, pl2_y, pl2_size/2, pl2_size/2); // значёк звука над маленьким персонажем
        ctx.drawImage(pic10, player_pic_x, player_pic_y, 46, 46, pl_x, pl_y, pl_size, pl_size);  // БОЛЬШОЙ ПИКАЧУ
        

        // ОТРИСОВКА БОНУСА И ЕГО ЭФФЕКТОВ
        if (timer_4 < 4) timer_4++; else {
            timer_4 = 0;
            bonus.sprite++;
            if (bonus.sprite > bonus.sprite_count) bonus.sprite = 0;
        }
        if (bonus.visible == 1) {
            bonus.sprite_count = 8;
            bonus.size_init = 182;
            if (bonus.type == 0) // бонус телепорт
                ctx.drawImage(pic13, bonus.sprite*bonus.size_init, 0, bonus.size_init, bonus.size_init, bonus.x, bonus.y, drug_size*1.3, drug_size*1.3);
            else // бонус скорость
                ctx.drawImage(pic12, bonus.sprite*bonus.size_init, 0, bonus.size_init, bonus.size_init, bonus.x, bonus.y, drug_size*1.3, drug_size*1.3);
        }
        else if (bonus.active == 1) {
            if (bonus.type == 0) { /* телепорт */
                bonus.sprite_count = 20;
                bonus.size_init = 192;
                if (bonus.person == 0) { // игрок
                    ctx.drawImage(pic15, bonus.sprite*bonus.size_init, 0, bonus.size_init, bonus.size_init, pl_x-pl_size*0.5, pl_y-pl_size*0.7, pl_size*2.1, pl_size*2.1);                
                }
                else { // нарк
                    ctx.drawImage(pic15, bonus.sprite*bonus.size_init, 0, bonus.size_init, bonus.size_init, pl2_x-pl2_size*0.5, pl2_y-pl2_size*0.7, pl2_size*2.1, pl2_size*2.1);                
                }
                }
            else { /* скорость */
                bonus.sprite_count = 31;
                bonus.size_init = 128;
                if (bonus.person == 0) { // игрок
                    ctx.drawImage(pic14, bonus.sprite*bonus.size_init, 0, bonus.size_init, bonus.size_init, pl_x-pl_size*1.05, pl_y-pl_size*1.45, pl_size*3, pl_size*3);
                }
                else { // нарк
                    ctx.drawImage(pic14, bonus.sprite*bonus.size_init, 0, bonus.size_init, bonus.size_init, pl2_x-pl2_size*1.05, pl2_y-pl2_size*1.45, pl2_size*3, pl2_size*3);
                }
            }
        }   

    }
}




function toogleAudio() { // остановка/воспроизведение активного аудио во время паузы
    // определяем какое audio сейчас воспроизводится
    if (indexOfPlayedAudio == 0) { // если перед этим мы не ставили аудио на паузу, то ставим на паузу
        if (!die_mf.paused) die_mf.pause(), indexOfPlayedAudio = 1;
        if (!decadence.paused) decadence.pause(), indexOfPlayedAudio = 2;
        if (!heh.paused) heh.pause(), indexOfPlayedAudio = 3;
        if (!laugh.paused) laugh.pause(), indexOfPlayedAudio = 4;
    }
    else {
        if (indexOfPlayedAudio == 1) die_mf.play();
        if (indexOfPlayedAudio == 2) decadence.play();
        if (indexOfPlayedAudio == 3) heh.play();
        if (indexOfPlayedAudio == 4) laugh.play();
        indexOfPlayedAudio = 0;
    }    
}


// СПРАВКА 
help.addEventListener("mousemove", e => {
    let textHelp = help.getAttribute('data-help');
    tooltip.style.width = `${Math.sqrt(textHelp.length) * 1.85}em`;
    tooltip.style.left = `${e.pageX+20}px`;            
    tooltip.style.top = `${e.pageY-tooltip.clientHeight}px`;
    tooltip.style.opacity = 0.8;
    tooltip.textContent = `${textHelp}`;
});
help.addEventListener("mouseout", e => {
    tooltip.style.opacity = 0;
});

/* ОБРАБОТКА НАЖАТИЙ НА КЛАВИШИ */ 
document,addEventListener("keydown", (e) => { // если нажали клавишу
    switch (e.code) {
        case "ArrowLeft": dir.l = 1; break;
        case "ArrowUp": dir.u = 1; break;
        case "ArrowRight": dir.r = 1; break;
        case "ArrowDown": dir.d = 1; break;
        case "KeyX": if (lightsCount > 0) attack = 1; break;
        case "Enter": 
            if (level > 4 || Game_mode == 4) welcome_song_trig = 0, level = 1, Game_mode = 0; 
            else {
                if (isNextLevel == 0) {
                    if (Game_mode == 0) welcome.play(); // начало                     
                    if (Game_mode == 0 || Game_mode == 3) {                        
                        isNextLevel = 1;
                        setTimeout(function () { changeLevel(); }, 1000); // выигрыш
                    }
                
                }
                
            }
            break;
        case "Space": 
            if (switch_trig == 0 && (Game_mode == 1 || Game_mode == 2)) { // пауза в игре
                switch_trig = 1;
                Game_mode = (Game_mode == 1) ? 2 : 1; 
                toogleAudio();
            }
            break;
        case "F5": location.href = location.href; break;//116
        case "KeyQ": catch_and_shock(); break; // ДЛЯ ДЕБАГА: +1 к лечению
        //case "KeyE": complete_addiction(); break; // ДЛЯ ДЕБАГА: проигрыш
    }
}); 
        
document.addEventListener("keyup", (e) => { // если отпустили клавишу
    switch (e.code) {
        case "ArrowLeft": dir.l = 0; break;
        case "ArrowUp": dir.u = 0; break;
        case "ArrowRight": dir.r = 0; break;
        case "ArrowDown": dir.d = 0; break;
        case "KeyX": attack = 0, fst_att = 0; break; 
        case "Space": switch_trig = 0; break;
    }
});	

// audio.addEventListener('ended', function() { }, false);
// document.documentElement.webkitRequestFullscreen(); // полный экран
// document.exitFullscreen()