let map;
let citys = [];

function initCitys(callback) {
	let names = ['Zhengzhou', 'Kaifeng', 'Luoyang', 'Xuchang', 'Zhoukou', 'Zhumadian', 'Xinyang', 'Anyang', 'Hebi', 'Xinxiang', 'Puyang', 'Jiaozuo', 'Sanmenxia', 'Pingdingshan', 'Nanyang', 'Shangqiu'];
	citys.counter = 0;
	names.forEach(function(value) {
		let i = citys.length;
		citys.push({name: value});
		$.ajax({
			type: 'GET',
			url: 'https://maps.googleapis.com/maps/api/geocode/json',
			data: {key: 'AIzaSyCqwwiiauC94QS6ehRFAU3yssczEUpeqBc', address: value},
			success: function(resp) {
				if (resp.status === 'OK') {
					citys[i].marker = new google.maps.Marker({position: resp.results[0].geometry.location, map: map, animation: google.maps.Animation.BOUNCE});
					citys[i].infoWindow = new google.maps.InfoWindow({content: citys[i].name});
					(function(city) {
						city.marker.addListener('click', function() {
							showInfoWindow(city);
						});
						setTimeout(function() {
							city.marker.setAnimation(null);
						}, 1000);
					})(citys[i]);
				}
			},
			complete: function() {
				if (++citys.counter === names.length && callback) {
					callback();
				}
			}
		});
	});
}

function shakeMarker(marker) {
	marker.setAnimation(google.maps.Animation.BOUNCE);
	setTimeout(function() {
		marker.setAnimation(null);
	}, 1000);
}

function showInfoWindow(city) {
	citys.forEach(function(city) {
		city.infoWindow && city.infoWindow.close();
	});
	city.infoWindow.setContent('Loading photo...');
	city.infoWindow.open(map, city.marker);
	$.ajax({
		type: 'GET',
		url: 'https://api.flickr.com/services/rest/',
		data: {method: 'flickr.photos.search', api_key: '64147ab7d6588a0822243b78336b26b9', text: city.name, per_page: 1, format: 'json', nojsoncallback: 1},
		success: function(resp) {
			if (resp.stat === 'ok' && resp.photos.photo.length > 0) {
				let photoInfo = resp.photos.photo[0];
				city.infoWindow.setContent('<img src="https://farm'+photoInfo.farm+'.staticflickr.com/'+photoInfo.server+'/'+photoInfo.id+'_'+photoInfo.secret+'_m.jpg">');
			} else {
				city.infoWindow.setContent('No photo.');
			}
		},
		error: function() {
			city.infoWindow.setContent('Can not get photo.');
		}
	})
	shakeMarker(city.marker);
}

function HenanCityModel() {
	let model = this;

	model.keyword = ko.observable('');
	model.results = ko.computed(function() {
		return citys.filter(function(city) {
			let isMactched = new RegExp(model.keyword(), 'i').test(city.name);
			city.infoWindow && city.infoWindow.close();
			city.marker.setMap(isMactched ? map : null);
			if (isMactched) {
				shakeMarker(city.marker);
			}
			return isMactched;
		});
	});

	model.showInfo = function() {
		showInfoWindow(this);
	};

	model.hideLeft = ko.observable(screen.width < 500);
	model.toggleLeft = function() {
		model.hideLeft(!model.hideLeft());
	};
}

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 34.0655761, lng: 113.7350095},
		zoom: 7
	});
	initCitys(function() {
		ko.applyBindings(new HenanCityModel());
	});
}