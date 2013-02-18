var result = new Array(),
	map = new Array(), birth = new Array(), snake = new Array(), beans = new Array(),
	direction = new Array(), dir_changed = new Array(),
	gameplay = new Array(),
	scores = new Array(), score_up,
	bean_count,
	i,interval_handle,
	scene = document.getElementById("scene"),
	speed, speed_txt = document.getElementById("speed"),
	players, players_txt = document.getElementById("players"),
	game_mode, game_mode_txt = document.getElementById("game_mode"),
	playback, playback_txt = document.getElementById("playback"),
	level, level_max, level_txt = document.getElementById("level");

//initialize global variables
bean_count = 1;
direction[0] = 2; dir_changed[0] = false;
direction[1] = 3; dir_changed[1] = false;
gameplay[0] = true;
gameplay[1] = true;
scores[0] = document.getElementById("scoreboard0");
scores[1] = document.getElementById("scoreboard1");
score_up = 100;
speed = 750;
speed_txt.innerHTML = "EASY";
players = 1;
players_txt.innerHTML = "SINGLE PLAYER";
game_mode = "ARCADE";
game_mode_txt.innerHTML = "ARCADE";
playback = true;
playback_txt.innerHTML = "PAUSE";
level = 0; level_max = 2;
level_txt.innerHTML = "MAP1";

//initialize map from given file
function load_map(url){
	var objXml = new XMLHttpRequest(),
		response_text = "",
		i = 0, j = 0, m_width = 0, m_height = 0,
		el_tr, el_td;
	objXml.open("GET", url, false);
	objXml.send(null);
	response_text = objXml.responseText;

	//transform map string to array
	map = response_text.split("\r\n");
	for(i = 0; i < map.length; i++){
		map[i] = map[i].split(" ");
	}

	//clear map
	for(i = scene.rows.length - 1; i >= 0; i--){
		scene.deleteRow(i);
	}

	//generate map
	for(i = 0; i < map.length; i++){
		el_tr = scene.insertRow(i);
		for(j = 0; j < map[i].length; j++){
			el_td = el_tr.insertCell(j);
			//el_td.innerHTML = j;
			if(map[i][j] == '0'){ //normal block
				el_td.setAttribute("class", "scene");
				el_td.setAttribute("className", "scene");
			}
			else if(map[i][j] == '1'){ //wall
				el_td.setAttribute("class", "wall");
				el_td.setAttribute("className", "wall");
			}
			else if(map[i][j] == 'S'){ //P1 birth place
				el_td.setAttribute("class", "scene");
				el_td.setAttribute("className", "scene");
				birth[0] = [j, i];
			}
			else if(map[i][j] == 'P'){ //P2 birth place
				el_td.setAttribute("class", "scene");
				el_td.setAttribute("className", "scene");
				birth[1] = [j, i];
			}
		}
	}

	//reset game control
	gameplay[0] = true;
	gameplay[1] = true;
	scores[0].innerHTML = "0";
	scores[1].innerHTML = "0";
	playback = true;
	playback_txt.innerHTML = "PAUSE";
}

//initialize snake
function load_snakes(){
	snake = new Array();

	snake[0] = new Array();
	snake[0][0] = [birth[0][0], birth[0][1], 2, false, false];
	snake[0][1] = [birth[0][0] + 1, birth[0][1], 2, birth[0][0], birth[0][1]];
	snake[0][2] = [birth[0][0] + 2, birth[0][1], 2, birth[0][0] + 1, birth[0][1]];

	//load P2
	if(players == 2){
		snake[1] = new Array();
		snake[1][0] = [birth[1][0], birth[1][1], 3, false, false];
		snake[1][1] = [birth[1][0] - 1, birth[1][1], 3, birth[1][0], birth[1][1]];
		snake[1][2] = [birth[1][0] - 2, birth[1][1], 3, birth[1][0] + 1, birth[1][1]];
	}
	
	//reset snake direction
	direction[0] = 2;
	direction[1] = 3;
}

//initialize beans
function load_beans(bean_count){
	var m_width = map.length,
		m_height = map[0].length,
		i, j, k,
		bean_ok = true;

	for(i = 0; i < bean_count; i++){
		while(1){
			bean_ok = true;
			beans[i] = [Math.round((m_width - 1) * Math.random(), 0), Math.round((m_height - 1) * Math.random(), 0), Math.random()];
			if(map[beans[i][1]][beans[i][0]] != '1'){ //bean is not in the wall
				for(j = 0; j < snake.length; j++){ //loop through every single snake
					for(k = 0; k < snake[j].length; k++){ //loop through every block of snake
						if(snake[j][k][0] == beans[i][0] && snake[j][k][1] == beans[i][1]) bean_ok = false; //bean is in the snakes
					}
				}
			}
			else bean_ok = false;
			if(bean_ok) break;
		}
	}
}

//start game
function pick_map(level){
	load_map("map" + level + ".txt");
	load_snakes();
	load_beans(bean_count);
}

//go to next level
function run_next_level(){
	if(level == level_max){
		alert("cong!");
		level = 0;
	}
	else{
		alert("next level");
		level = level + 1;
	}
	level_txt.innerHTML = "MAP" + (level+1);
	pick_map(level);
}

//get next position of snake head
function get_next_pos(src_x, src_y, dirc, w, h){
	var pos_x, pos_y;
	switch(dirc){
	case 0: //up
		pos_x = parseInt(src_x);
		pos_y = parseInt(src_y) - 1;
		if(pos_y < 0) pos_y = h - 1;
		break;
	case 1: //down
		pos_x = parseInt(src_x);
		pos_y = parseInt(src_y) + 1;
		if(pos_y > h - 1) pos_y = 0;
		break;
	case 2: //left
		pos_y = parseInt(src_y);
		pos_x = parseInt(src_x) - 1;
		if(pos_x < 0) pos_x = w - 1;
		break;
	case 3: //right
		pos_y = parseInt(src_y);
		pos_x = parseInt(src_x) + 1;
		if(pos_x > w - 1) pos_x = 0;
		break;
	}
	return [pos_x, pos_y];
}

//render snake
function run_snake(){
	var next_pos = new Array(),
		new_snake = new Array(),
		m_width = 0, m_height = 0, i, j, k;
	
	//scene border
	m_width = map.length;
	m_height = map[0].length;

	//calculate next position
	for(i = 0; i < snake.length; i++){
		new_snake[i] = new Array();
		if(gameplay[i]){
			//next position of snake head
			next_pos = get_next_pos(snake[i][0][0], snake[i][0][1], direction[i], m_width, m_height);
			new_snake[i][0] = [next_pos[0], next_pos[1], direction[i], false, false];

			//new snake position
			for(j = 1; j < snake[i].length; j++){
				new_snake[i][j] = [snake[i][j-1][0], snake[i][j-1][1], false, new_snake[i][j-1][0], new_snake[i][j-1][1]];
			}
		}
		else{
			new_snake[i] = snake[i];
		}
	}

	for(i = 0; i < new_snake.length; i++){
		//snake is dead already
		if(!gameplay[i]) continue;

		//snake hits wall
		if(map[new_snake[i][0][1]][new_snake[i][0][0]] == '1'){
			alert("player " + i + " game over!");
			gameplay[i] = false;
		}

		for(j = 0; j < new_snake.length; j++){
			//head on
			if(i != j && ((new_snake[i][0][0] == snake[j][0][0] && new_snake[i][0][1] == snake[j][0][1] && new_snake[j][0][0] == snake[i][0][0] && new_snake[j][0][1] == snake[i][0][1]) ||
			   (new_snake[i][0][0] == new_snake[j][0][0] && new_snake[i][0][1] == new_snake[j][0][1]))){
				if(gameplay[j]){
					alert("player " + i + " and " + j + " game over!");
					gameplay[i] = false;
					gameplay[j] = false;
				}
				else{
					alert("player " + i + " game over!");
					gameplay[i] = false;
				}
			}

			//hits snake body
			for(k = 1; k < new_snake[j].length; k++){
				if(new_snake[i][0][0] == new_snake[j][k][0] && new_snake[i][0][1] == new_snake[j][k][1]){
					alert("player " + i + " game over!");
					gameplay[i] = false;
				}
			}
		}
	}

	//hits dead snake tail
	for(i = 0; i < new_snake.length; i++){
		if(!gameplay[i]) continue;
		for(j = 0; j < snake.length; j++){
			if(gameplay[j]) continue;
			if(new_snake[i][0][0] == snake[j][snake[j].length-1][0] && new_snake[i][0][1] == new_snake[j][snake[j].length-1][1]){
				alert("player " + i + " game over!");
				gameplay[i] = false;
			}
		}
	}

	for(i = 0; i < new_snake.length; i++){
		if(gameplay[i]){
			scene.rows[snake[i][snake[i].length-1][1]].cells[snake[i][snake[i].length-1][0]].className = 'scene'; //remove tail
			scene.rows[new_snake[i][0][1]].cells[new_snake[i][0][0]].className = 'snakeh' + i;
			scene.rows[new_snake[i][1][1]].cells[new_snake[i][1][0]].className = 'snake' + i;
			dir_changed[i] = false;
			snake[i] = new_snake[i];
		}
	}
}

//score board
function run_beans(){
	var m_width = 0, m_height = 0, i, j, k, bean_ok = true;

	m_width = map.length;
	m_height = map[0].length;

	for(i = 0; i < beans.length; i++){
		for(j = 0; j < snake.length; j++){
			if(snake[j][0][0] == beans[i][0] && snake[j][0][1] == beans[i][1]){ //snake ate bean
				if(beans[i][2] > 0.5) scores[j].innerHTML = parseInt(scores[j].innerHTML) + 10;
				else scores[j].innerHTML = parseInt(scores[j].innerHTML) + 1;
				snake[j][snake[j].length] = [snake[j][snake[j].length-1][0], snake[j][snake[j].length-1][1], false, snake[j][snake[j].length-1][0], snake[j][snake[j].length-1][1]]; //snake length + 1
				
				//generate new bean
				while(1){
					bean_ok = true;
					beans[i] = [Math.round((m_width - 1) * Math.random(), 0), Math.round((m_height - 1) * Math.random(), 0), Math.random(), Math.random()];
					if(map[beans[i][1]][beans[i][0]] == '1'){ //bean in wall
						bean_ok = false;
					}
					else{
						for(j = 0; j < snake.length; j++){
							for(k = 0; k < snake[j].length; k++){
								if(snake[j][k][0] == beans[i][0] && snake[j][k][1] == beans[i][1]){ //bean in snake
									bean_ok = false;
								}
							}
						}

						for(j = 0; j < beans.length; j++){
							if(i != j && beans[j][0] == beans[i][0] && beans[j][1] == beans[i][1]){ //bean in bean
								bean_ok = false;
							}
						}
					}
					if(bean_ok) break;
				}
			}
		}

		if(beans[i][2] > 0.5) scene.rows[beans[i][1]].cells[beans[i][0]].className = 'bigbean';
		else scene.rows[beans[i][1]].cells[beans[i][0]].className = 'bean';
	}

	if(game_mode == "ARCADE" && scores[0].innerHTML >= score_up && players == 1){
		run_next_level();
	}
}

//pause/resume/restart button
playback_txt.onclick = function(){
	if(playback_txt.innerHTML == "PAUSE"){
		playback_txt.innerHTML = "RESUME";
		playback = false;
	}
	else if(playback_txt.innerHTML == "RESUME"){
		playback_txt.innerHTML = "PAUSE";
		playback = true;
	}
	else if(playback_txt.innerHTML == "RESTART"){
		pick_map(level);
	}
}

//pick level
level_txt.onclick = function(){
	if(level == level_max) level = 0;
	else level++;
	level_txt.innerHTML = "MAP" + (level+1);
	pick_map(level);
}

//pick game mode
game_mode_txt.onclick = function(){
	if(game_mode == "SURVIVAL" && players == 1) game_mode = "ARCADE";
	else game_mode = "SURVIVAL";

	game_mode_txt.innerHTML = game_mode;
	pick_map(level);
}

//pick players
players_txt.onclick = function(){
	if(players == 1){
		players = 2;
		players_txt.innerHTML = "MULTI PLAYER";
		game_mode = "SURVIVAL";
		game_mode_txt.innerHTML = game_mode;
	}
	else{
		players = 1;
		players_txt.innerHTML = "SINGLE PLAYER";
	}
	pick_map(level);
}

//pick speed
speed_txt.onclick = function(){
	if(speed == 750){
		speed = 400;
		speed_txt.innerHTML = "NORMAL";
	}
	else if(speed == 400){
		speed = 100;
		speed_txt.innerHTML = "HARD";
	}
	else{
		speed = 750;
		speed_txt.innerHTML = "EASY";
	}
	
	window.clearInterval(interval_handle);
	interval_handle = window.setInterval(function(){
		if(playback && ((players == 1 && gameplay[0]) || (players == 2 && (gameplay[0] || gameplay[1])))){
			if(!map.length){
				pick_map(0);
			}
			run_snake();
			run_beans();
		}
		else if((players == 1 && !gameplay[0]) || (players == 2 && !gameplay[0] && !gameplay[1])){
			playback_txt.innerHTML = "RESTART";
		}
	}, speed);
}

//key events
document.onkeydown = function(e){
	var ev = e || event;

	//arrow keys
	if(!dir_changed[0]){
		if(ev.keyCode == 87 && direction[0] != 1){ //W
			direction[0] = 0;
			dir_changed[0] = true;
		}
		if(ev.keyCode == 83 && direction[0] != 0){ //S
			direction[0] = 1;
			dir_changed[0] = true;
		}
		if(ev.keyCode == 65 && direction[0] != 3){ //A
			direction[0] = 2;
			dir_changed[0] = true;
		}
		if(ev.keyCode == 68 && direction[0] != 2){ //D
			direction[0] = 3;
			dir_changed[0] = true;
		}
	}

	if(!dir_changed[1]){
		if(ev.keyCode == 101 && direction[1] != 1){ //num5
			direction[1] = 0;
			dir_changed[1] = true;
		}
		else if(ev.keyCode == 98 && direction[1] != 0){ //num2
			direction[1] = 1;
			dir_changed[1] = true;
		}
		else if(ev.keyCode == 97 && direction[1] != 3){ //num1
			direction[1] = 2;
			dir_changed[1] = true;
		}
		else if(ev.keyCode == 99 && direction[1] != 2){ //num3
			direction[1] = 3;
			dir_changed[1] = true;
		}
	}

	//control keys
	if(ev.keyCode == 82){ //R
		playback_txt.click();
	}
	if(ev.keyCode == 77){ //M
		level_txt.click();
	}
	if(ev.keyCode == 49){ //1
		game_mode_txt.click();
	}
	if(ev.keyCode == 80){ //P
		players_txt.click();
	}
	if(ev.keyCode == 48){ //0
		speed_txt.click();
	}
	//alert(ev.keyCode);
}

//touch events
//arrow buttons
document.getElementById("arrow_up").ontouchstart = function(){
	if(!dir_changed[0] && direction[0] != 1){
		direction[0] = 0;
		dir_changed[0] = true;
	}
	this.style.background = "silver";
}
document.getElementById("arrow_up").ontouchend = function(){
	this.style.background = "white";
}
document.getElementById("arrow_down").ontouchstart = function(){
	if(!dir_changed[0] && direction[0] != 0){
		direction[0] = 1;
		dir_changed[0] = true;
	}
	this.style.background = "silver";
}
document.getElementById("arrow_down").ontouchend = function(){
	this.style.background = "white";
}
document.getElementById("arrow_left").ontouchstart = function(){
	if(!dir_changed[0] && direction[0] != 3){
		direction[0] = 2;
		dir_changed[0] = true;
	}
	this.style.background = "silver";
}
document.getElementById("arrow_left").ontouchend = function(){
	this.style.background = "white";
}
document.getElementById("arrow_right").ontouchstart = function(){
	if(!dir_changed[0] && direction[0] != 2){
		direction[0] = 3;
		dir_changed[0] = true;
	}
	this.style.background = "silver";
}
document.getElementById("arrow_right").ontouchend = function(){
	this.style.background = "white";
}

scene.ontouchstart = function(){
	playback_txt.click();
}

interval_handle = window.setInterval(function(){
	if(playback && ((players == 1 && gameplay[0]) || (players == 2 && (gameplay[0] || gameplay[1])))){
		if(!map.length){
			pick_map(0);
		}
		run_snake();
		run_beans();
	}
	else if((players == 1 && !gameplay[0]) || (players == 2 && !gameplay[0] && !gameplay[1])){
		playback_txt.innerHTML = "RESTART";
	}
}, speed);