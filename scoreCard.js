/**
 * Created by jarodmoser on 10/9/15.
 */

var accessToken, model, location, playerCount = 0, currentPlayer = 0, currentHole = 0;

//map info functions
function validateSwingBySwing() {
	var redirectURI = document.URL;
	var cliendId = "2a1d8689-9ba9-4864-8ae9-632cd44e793e";
	var swingBySwing = "https://api.swingbyswing.com/v2/oauth/authorize?scope=read&redirect_uri=" + redirectURI + "&response_type=token&client_id=" + cliendId;
	accessToken = getUrlVars().access_token;
	if (accessToken == null) {
		location.replace(swingBySwing);
	} else {
		accessToken = accessToken.replace("\n", "");
		getCourse(48802); // default course if no course was selected
	}
}

function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
		function (m, key, value) {
			vars[key] = value;
		});
	return vars;
}

//get course functions
function getSearchResults() {
	var address = $('#address').val(),
		geocoder = new google.maps.Geocoder(),
		searchlat,
		searchlng,
		searchResults;
	$('#waitForInfo').html(`Please wait for your location information to travel through time and space <i class="fa fa-spinner fa-spin"></i>`);
	geocoder.geocode({'address': address}, function (results, status) {
		if (status === google.maps.GeocoderStatus.OK) {
			searchlat = results[0].geometry.location.lat();
			searchlng = results[0].geometry.location.lng();
		} else {
			$('#waitForInfo').html(`Oops, looks like we didn't find anything, please try searching again`);
		}
	});
	setTimeout(function () {
		var dataURL = "https://api.swingbyswing.com/v2/courses/search_by_location?lat=" + searchlat + "&lng=" + searchlng + "&radius=50&active_only=yes&hole_count=18&order_by=distance_from_me_miles&from=1&limit=20&access_token=" + accessToken;
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function () {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
				searchResults = JSON.parse(xhttp.responseText);
			}
		};
		xhttp.open("GET", dataURL, true);
		xhttp.send();
		setTimeout(function () {
			if (searchResults.courses.length <= 0) {
				$('#waitForInfo').html(`Oops, looks like we didn't find anything, please try searching again`);
			} else {
				$('#courseChoosen').html('');
				var length = searchResults.courses.length;
				for (var i = 0; i < length; i++) {
					$('#courseChoosen').append(`<option value="${searchResults.courses[i].id}">${searchResults.courses[i].name}</option>`)
				}
				$('#waitForInfo').html('');
			}
		}, 3000);
	}, 3000);

}

function getCourse(courseId) {
	var dataURL = "https://api.swingbyswing.com/v2/courses/" + courseId + "?includes=practice_area,nearby_courses,recent_media,recent_comments,recent_rounds,best_rounds,current_rounds,course_stats_month,course_stats_year&access_token=" + accessToken;
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function () {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			model = JSON.parse(xhttp.responseText);
		}
	};
	xhttp.open("GET", dataURL, true);
	xhttp.send();
}

function courseMap(courseLocation) {
	$('#mapModal').modal('show');
	$('#mapTitle').html(`<h1>${model.course.name}</h1>`);
	setTimeout(function () {
		var map = new google.maps.Map(document.getElementById('map'), {
			zoom: 16,
			center: courseLocation,
			mapTypeId: google.maps.MapTypeId.SATELLITE
		});
	}, 200);

}

function initMap() {
	return
} // put this in her just because google's api is quirky

function holeMap(value) {
	$('#mapModal').modal('show');
	$('#mapTitle').html(`<h1>${model.course.name} - Hole ${value + 1}</h1>`);
	setTimeout(function () {
		var currentPlayerTee = playersInGame[currentPlayer].tee;
		var teeLocation = model.course.holes[value].tee_boxes[currentPlayerTee].location;
		var greenLocation = model.course.holes[value].green_location;

		var map = new google.maps.Map(document.getElementById('map'), {
			center: teeLocation,
			mapTypeId: google.maps.MapTypeId.SATELLITE
		});

		var tee = {
			url: 'tee.svg',
			scaledSize: new google.maps.Size(18, 36)
		};

		var teeOff = new google.maps.Marker({
			position: teeLocation,
			map: map,
			title: 'Tee',
			icon: tee
		});

		var flag = {
			url: 'flag.png',
			anchor: new google.maps.Point(0, 35),
			scaledSize: new google.maps.Size(35, 35)
		};

		var green = new google.maps.Marker({
			position: greenLocation,
			map: map,
			title: 'Green',
			icon: flag
		});

		var setBoundsOfMap = function () {
			var bounds = new google.maps.LatLngBounds();
			bounds.extend(new google.maps.LatLng(teeLocation.lat, teeLocation.lng));
			bounds.extend(new google.maps.LatLng(greenLocation.lat, greenLocation.lng));
			return map.fitBounds(bounds);
		}();
	}, 200);
}

//	scorecard setup functions
$(window).load(function () {
	$('#scoreCardSetup').modal('show');
});

function addPlayer() {
	playerCount++;
	var appendPlayerContent = `<div id="player${playerCount}">
      <div class="row">
        <div class="col-sm-10">
          <input type="text" class="form-control" id="player${playerCount}Name" placeholder="New Player">
        </div>
        <div class="col-sm-2 ">
          <button type="button" id="player${playerCount}Delete" class="btn btn-danger btn-sm pull-right" onclick="deletePlayer(this.id)">
            Delete
          </button>
        </div>
      </div>
      <div class="row">
        <div class="col-xs-3">
          <div class="radio">
            <label>
              <input type="radio" name="player${playerCount}Tee" id="womenTee" value="3"> Women Tee
            </label>
          </div>
        </div>
        <div class="col-xs-3">
          <div class="radio">
            <label>
              <input type="radio" name="player${playerCount}Tee" id="menTee" value="2" checked> Men Tee
            </label>
          </div>
        </div>
        <div class="col-xs-3">
          <div class="radio">
            <label>
              <input type="radio" name="player${playerCount}Tee" id="championTee" value="1"> Champion Tee
            </label>
          </div>
        </div>
        <div class="col-xs-3">
          <div class="radio">
            <label>
              <input type="radio" name="player${playerCount}Tee" id="proTee" value="0"> Pro Tee
            </label>
          </div>
        </div>
      </div>
    </div>`;
	$("#playerSetup").append(appendPlayerContent);
}

function deletePlayer(idToDelete) {
	idToDelete = idToDelete.substring(0, idToDelete.length - 6);
	$("#" + idToDelete).remove();
}

// player set up functions
var Player = function (playerId) {
	this.playerId = playerId;
	this.name = $("#" + playerId + "Name").val();
	this.tee = $('input[name="' + playerId + 'Tee"]:checked').val();
	this.score = function () {
		var temp = [];
		for (var i = 0; i < 18; i++) {
			temp.push(0);
		}
		return temp;
	}();

	this.strokes = function () {
		var temp = [];
		for (var i = 0; i < 18; i++) {
			temp.push(0);
		}
		return temp;
	}();

	this.updateScore = function (holeNumber, value) {
		this.strokes[holeNumber] = value;
		this.score[holeNumber] = value - model.course.holes[holeNumber].tee_boxes[0].par;
	};

	this.frontNine = function () {
		var total = 0;
		for (var i = 0; i < 9; i++) {
			total += this.score[i];
		}
		return total;
	};

	this.backNine = function () {
		var total = 0;
		for (var i = 9; i < 18; i++) {
			total += this.score[i];
		}
		return total;
	};

	this.totalScore = function () {
		return this.frontNine() + this.backNine();
	};

	this.totalStrokes = function() {
		return this.strokes.reduce(function(a, b) {
			return a + b;
		});
	}

};

function createPlayers() {
	playersInGame = [];
	var rawPlayerArr = [];
	$('#playerSetup > div').each(function () {
		rawPlayerArr.push($(this).attr('id'));
	});
	for (var i = 0; i < rawPlayerArr.length; i++) {
		playersInGame.push(new Player(rawPlayerArr[i]));
	}
	return playersInGame;
}

// html constructors
var createCarousel = {
	skeleton: function () {
		$("#currentInfo").html("").append(`
		<div id="playerCarousel" class="carousel slide" data-ride="carousel" data-interval="false">
		<!-- Wrapper for slides -->
		<div class="carousel-inner" role="listbox" id="playerCarouselInner"></div>
		`);
	},

	controls: function () {
		$("#playerCarouselInner").append(`
		<a class="left carousel-control carouselButtons" href="#playerCarousel" onclick="onCarouselLeft()" role="button" data-slide="prev">
			<span class="glyphicon glyphicon-chevron-left carouselButtons" aria-hidden="true"></span>
			<span class="sr-only">Previous Player</span>
		</a>
		<a class="right carousel-control carouselButtons" href="#playerCarousel" onclick="onCarouselRight()" role="button" data-slide="next">
			<span class="glyphicon glyphicon-chevron-right carouselButtons" aria-hidden="true"></span>
			<span class="sr-only">Next Player</span>
		</a>
		`);
	},

	players: function () {
		for (var i = 0; i < playersInGame.length; i++) {
			var active;
			if (i === currentPlayer) {
				active = " active";
			} else {
				active = "";
			}
			$('#playerCarouselInner').append(`
			<div class="item${active}">
				<div class="row">
					<div class="col-lg-3 col-xs-offset-3">
						<img class="portfolio" src="http://www.freelanceme.net/Images/default%20profile%20picture.png" alt="profile"/>
					</div>
					<div class="col-lg-6 text-center">
						<div class="col-lg-12"><h1>${playersInGame[i].name}</h1></div>
						<div class="row">
							<div class="col-xs-3"><h5>Front Nine</h5></div>
							<div class="col-xs-6"><h4>Total Score</h4></div>
							<div class="col-xs-3"><h5>Back Nine</h5></div>
						</div>
						<div class="row">
							<div class="col-xs-3"><h5>${playersInGame[i].frontNine()}</h5></div>
							<div class="col-xs-6"><h4>${playersInGame[i].totalScore()}</h4></div>
							<div class="col-xs-3"><h5>${playersInGame[i].backNine()}</h5></div>
						</div>
						<div class="col-xs-12 btn btn-primary" onclick="$('#scoreCardSetup').modal('show')"><h5>New Game</h5></div>
					</div>
				</div>
			</div>
			`);

		}
	}
};

var createTable = {
	skeleton: function () {
		$("#scoreCardTable").html("").append(`<div class="table-responsive">
		<table class="table table-striped table-fixedheader text-center">
			<thead><tr id="header"><th>Hole</th></tr></thead>
			<tbody>
			<tr id="0"><td>1</td></tr>
			<tr id="1"><td>2</td></tr>
			<tr id="2"><td>3</td></tr>
			<tr id="3"><td>4</td></tr>
			<tr id="4"><td>5</td></tr>
			<tr id="5"><td>6</td></tr>
			<tr id="6"><td>7</td></tr>
			<tr id="7"><td>8</td></tr>
			<tr id="8"><td>9</td></tr>
			<tr id="9"><td>10</td></tr>
			<tr id="10"><td>11</td></tr>
			<tr id="11"><td>12</td></tr>
			<tr id="12"><td>13</td></tr>
			<tr id="13"><td>14</td></tr>
			<tr id="14"><td>15</td></tr>
			<tr id="15"><td>16</td></tr>
			<tr id="16"><td>17</td></tr>
			<tr id="17"><td>18</td></tr>
			</tbody>
			<tfoot>
			<tr id="footer"><td>Totals</td></tr>
			</tfoot>
		</table>
	</div>`);

	},

	par: function () {
		$('#header').append("<th>Par</th>");
		var holes = model.course.holes.length;
		var total = 0;
		for (var i = 0; i < holes; i++) {
			$('#' + i).append(`<td>${model.course.holes[i].tee_boxes[0].par}</td>`);
			total += model.course.holes[i].tee_boxes[0].par
		}
		$('#footer').append(`<td>${total}</td>`)
	},

	yard: function () {
		$('#header').append("<th>Yards</th>");
		var holes = model.course.holes.length;
		var currentPlayerTee = playersInGame[currentPlayer].tee;
		if (currentPlayerTee >= model.course.holes[0].tee_boxes.length) {
			currentPlayerTee = model.course.holes[0].tee_boxes.length - 1;
		}
		var total = 0;
		for (var i = 0; i < holes; i++) {
			$('#' + i).append(`<td id="yard${i}"><a href="#" onclick="holeMap(${i})"><div>${model.course.holes[i].tee_boxes[currentPlayerTee].yards} <i class="fa fa-map-pin"></i></div></a></td>`);
			total += model.course.holes[i].tee_boxes[currentPlayerTee].yards
		}
		$('#footer').append(`<td><a href="#" onclick="courseMap(model.course.location)"><div>${total} <i class="fa fa-map-pin"></i></div></a></td>`)
	},

	players: function () {
		for (var i = 0; i < playersInGame.length; i++) {
			$('#header').append(`<th>${playersInGame[i].name}</th>`);
			var holes = playersInGame[i].strokes.length;
			for (var j = 0; j < holes; j++) {
				$('#' + j).append(`<td><a href="#" onclick="setPlayerAndHole(${i}, ${j})"><div>${playersInGame[i].strokes[j]}</div></a></td>`);
			}
			$('#footer').append(`<td>${playersInGame[i].totalStrokes()}</td>`)
		}
		var sizeOfColumns = 100 / (3 + playersInGame.length);
		$("tr > th, tr > td").css("width", sizeOfColumns + "%");
	}
};

function saveAndClose() {
	$('#scoreCardSetup').modal('hide');
	$('#loadingModal').modal('show');
	var courseId = $('#courseChoosen option:selected').val();
	getCourse(courseId);
	var interval = 4;
	var progressBar = setInterval(function(){
		$('#progressBar').css('width', interval + '%');
		interval += 4;
	}, 50);
	setTimeout(function () {
		createPlayers();
		createTable.skeleton();
		createTable.par();
		createTable.yard();
		createTable.players();
		createCarousel.skeleton();
		createCarousel.players();
		createCarousel.controls();
		courseMap(model.course.location);
		$('#loadingModal').modal('hide');
		clearInterval(progressBar)
	}, 2500)
}

function setPlayerAndHole(whichPlayer, whichHole) {
	$('#scoreModal').modal('show');
	currentPlayer = whichPlayer;
	currentHole = whichHole
}

function updateScoreCard(value) {
	playersInGame[currentPlayer].updateScore(currentHole, value);
	createTable.skeleton();
	createTable.par();
	createTable.yard();
	createTable.players();
	createCarousel.skeleton();
	createCarousel.players();
	createCarousel.controls();
	$('#scoreModal').modal('hide');
}

function onCarouselLeft() {
	if (currentPlayer === 0) {
		currentPlayer = playersInGame.length;
	}
	currentPlayer = (currentPlayer - 1)%playersInGame.length;
	createTable.skeleton();
	createTable.par();
	createTable.yard();
	createTable.players();
}

function onCarouselRight() {
	currentPlayer = (currentPlayer + 1)%playersInGame.length;
	createTable.skeleton();
	createTable.par();
	createTable.yard();
	createTable.players();
}

//TODO list for player set up
//TODO build verification for player name
//TODO incorporate jQuery UI for reodering of players
//TODO format the background of player list items

//TODO list for score card
//TODO find profile pics for tee player difference
