const openWeatherApiKey = "c67c51da2d0f0debd4b9590c8af07f77";

function getSearchHistory() {
  const data = window.localStorage.getItem("history");
  if (data) {
    return JSON.parse(data);
  }
  return [];
}

function saveItemInSearchHistory(item) {
  const data = getSearchHistory();
  data.push(item);
  window.localStorage.setItem("history", JSON.stringify(data));
}

function createSearchHistory(history) {
  const historyContainer = document.getElementById("history-container");
  historyContainer.innerHTML = "";
  history.forEach((item) => {
    const buttonEl = document.createElement("button");
    buttonEl.setAttribute("type", "button");
    buttonEl.classList.add("btn", "btn-primary", "btn-lg", "btn-block");
    buttonEl.style.display = "block";
    buttonEl.style.marginBottom = "10px";
    buttonEl.style.width = "100%";
    buttonEl.onclick = () => {
      updatePage(item);
    };
    buttonEl.innerHTML = item;
    historyContainer.appendChild(buttonEl);
  });
}

function onSearchClick() {
  const inputEl = document.getElementById("searchInput");
  saveItemInSearchHistory(inputEl.value);
  updatePage(inputEl.value);
}

function setLoading(value) {
  const loadingEl = document.getElementById("loading");
  const layoutEl = document.getElementById("layout");

  if (value) {
    loadingEl.style.display = "flex";
    layoutEl.style.display = "none";
  } else {
    layoutEl.style.display = "grid";
    loadingEl.style.display = "none";
  }
}

async function fetchLatitudeLong(cityName, apiKey) {
  const baseURL = "https://api.openweathermap.org/geo/1.0/direct";
  const params = {
    q: cityName,
    appid: apiKey,
  };
  const paramsStr = encodeURI(
    Object.entries(params)
      .map((key) => key[0] + "=" + key[1])
      .join("&")
  );
  const url = baseURL + "?" + paramsStr;
  const response = await fetch(url);
  const body = await response.json();

  if (body.length === 0) {
    throw "City not found";
  } else {
    return {
      name: body[0].name,
      latitude: body[0].lat,
      longitude: body[0].lon,
    };
  }
}

async function fetchWeatherData(latitude, longitude, apiKey) {
  const baseURL = "https://api.openweathermap.org/data/2.5/onecall";
  const params = {
    lat: latitude,
    lon: longitude,
    exclude: "minutely,hourly",
    appid: apiKey,
    units: "imperial",
  };
  const paramsStr = encodeURI(
    Object.entries(params)
      .map((key) => key[0] + "=" + key[1])
      .join("&")
  );
  const url = baseURL + "?" + paramsStr;
  const response = await fetch(url);
  const body = await response.json();

  if (body.cod) {
    throw "Invalid lattidude or long";
  } else {
    return {
      today: {
        date: new Date(body.current.dt * 1000),
        temperature: body.current.temp,
        windSpeed: body.current.wind_speed,
        humidity: body.current.humidity,
        uvIndex: body.current.uvi,
      },
      daily: body.daily
        .map((day) => ({
          date: new Date(day.dt * 1000),
          temperature: day.temp.day,
          windSpeed: day.wind_speed,
          humidity: day.humidity,
          uvIndex: day.uvi,
        }))
        .slice(1, 6),
    };
  }
}

function populatePageWithData(cityName, data) {
  const todayTitleEl = document.getElementById("today-title");
  const todayTempEl = document.getElementById("today-temp");
  const todayWindEl = document.getElementById("today-wind");
  const todayHumidityEl = document.getElementById("today-humidity");
  const todayUVIndexEl = document.getElementById("today-uv-index");
  const formattedDate = `${data.today.date.getMonth()}/${data.today.date.getDate()}/${data.today.date.getUTCFullYear()}`;
  todayTitleEl.innerHTML = `${cityName} (${formattedDate})`;
  todayTempEl.innerHTML = data.today.temperature;
  todayWindEl.innerHTML = data.today.windSpeed;
  todayHumidityEl.innerHTML = data.today.humidity;
  todayUVIndexEl.innerHTML = data.today.uvIndex;

  data.daily.forEach((day, index) => {
    const dayFormattedDate = `${day.date.getMonth()}/${day.date.getDate()}/${day.date.getUTCFullYear()}`;
    const dayTitleEl = document.getElementById(`day-${index + 1}-title`);
    dayTitleEl.innerHTML = `${cityName} (${dayFormattedDate})`;
    const dayTempEl = document.getElementById(`day-${index + 1}-temp`);
    dayTempEl.innerHTML = day.temperature;
    const dayWindEl = document.getElementById(`day-${index + 1}-wind`);
    dayWindEl.innerHTML = day.windSpeed;
    const dayHumidityEl = document.getElementById(`day-${index + 1}-humidity`);
    dayHumidityEl.innerHTML = day.humidity;
  });
}

async function updatePage(cityName) {
  setLoading(true);
  const latLon = await fetchLatitudeLong(cityName, openWeatherApiKey);
  const data = await fetchWeatherData(
    latLon.latitude,
    latLon.longitude,
    openWeatherApiKey
  );
  createSearchHistory(getSearchHistory());
  populatePageWithData(latLon.name, data);
  setLoading(false);
}

function main() {
  updatePage("Chicago");
}
