const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const dateElement = document.getElementById("date");
const weatherIcon = document.getElementById("weatherIcon");
const loadingSpinner = document.getElementById("loadingSpinner");
const errorMessage = document.getElementById("errorMessage");
const weatherInfo = document.getElementById("weatherInfo");
const recentSearchesContainer = document.getElementById("recentSearches");
const suggestionsList = document.getElementById("suggestionsList");

let recentSearches = JSON.parse(localStorage.getItem("weatherSearches")) || [];
const API_KEY = "f41c44714f23f472d2013a9b2fe63a4a";

renderRecentSearches();


if (recentSearches.length > 0) {
  // Agar pehle kuch search kiya hai, toh sabse latest wala auto-load karo
  getWeatherData(`q=${recentSearches[0]}`); 
} else {
  // Agar pehli baar app khola hai, toh default Delhi load karo
  getWeatherData("q=Delhi"); 
}


function updateBackground(weatherMain) {
  document.body.className = ""; // Purani class hatao

  if (weatherMain === "Clear") document.body.classList.add("weather-clear");
  else if (weatherMain === "Clouds")
    document.body.classList.add("weather-clouds");
  else if (
    weatherMain === "Rain" ||
    weatherMain === "Drizzle" ||
    weatherMain === "Thunderstorm"
  )
    document.body.classList.add("weather-rain");
  else if (weatherMain === "Snow") document.body.classList.add("weather-snow");
  else document.body.classList.add("weather-haze"); // Haze, Mist, Fog
}

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city !== "") getWeatherData(`q=${city}`);
});

// NAYA: Jaise hi user kuch type karega, yeh chalega
cityInput.addEventListener("input", async (e) => {
  const val = e.target.value.trim();
  
  // Agar input khali hai (user ne backspace daba diya), toh list chupao
  if (val.length === 0) {
    suggestionsList.innerHTML = "";
    suggestionsList.classList.add("hidden");
    return;
  }

  try {
    // OpenWeather ki Geocoding API ko call lagaya (Top 5 results ke liye)
    const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${val}&limit=5&appid=${API_KEY}`);
    const cities = await res.json();
    
    suggestionsList.innerHTML = ""; // Purane suggestions hatao
    
    if (cities.length > 0) {
      suggestionsList.classList.remove("hidden"); // List dikhao
      
      // Har ek city ke liye ek naya <li> tag banao
      cities.forEach(city => {
        const li = document.createElement("li");
        
        // Agar state ka naam available hai, toh wo bhi dikhao (Jaise: Kota, Rajasthan, IN)
        const stateName = city.state ? `${city.state}, ` : "";
        li.innerText = `${city.name}, ${stateName}${city.country}`;
        
        // Jab user suggestion par click kare
        li.addEventListener("click", () => {
          cityInput.value = city.name; // Input box me pura naam bhar do
          suggestionsList.classList.add("hidden"); // Dropdown chupao
          getWeatherData(`q=${city.name}`); // Us city ka weather search kardo
        });
        
        suggestionsList.appendChild(li);
      });
    } else {
      // Agar us alphabet se koi city nahi mili toh chupao
      suggestionsList.classList.add("hidden");
    }
  } catch (error) {
    console.log("Suggestions fetch karne mein error aayi");
  }
});

// NAYA: Agar user list ke bahar screen par kahin bhi click kare, toh list chupao
document.addEventListener("click", (e) => {
  if (!cityInput.contains(e.target) && !suggestionsList.contains(e.target)) {
    suggestionsList.classList.add("hidden");
  }
});

// NAYA: Location Button Logic
locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        getWeatherData(`lat=${lat}&lon=${lon}`);
      },
      () => {
        alert("📍 Please enable location services to use this feature.");
      },
    );
  }
});

// Function ko modify kiya taaki city naam ya location coordinates dono le sake
async function getWeatherData(query) {
  try {
    weatherInfo.classList.add("hidden");
    errorMessage.classList.add("hidden");
    loadingSpinner.classList.remove("hidden");

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${query}&units=metric&appid=${API_KEY}`,
    );
    const data = await response.json();

    loadingSpinner.classList.add("hidden");

    if (response.ok) {
      weatherInfo.classList.remove("hidden");

      cityName.innerText = `${data.name}, ${data.sys.country}`;
      temperature.innerText = `${Math.round(data.main.temp)}°C`;
      description.innerText = data.weather[0].main;
      humidity.innerText = `${data.main.humidity}%`;
      let windInKmph = (data.wind.speed * 3.6).toFixed(1);
      windSpeed.innerText = `${windInKmph} km/h`;

      const iconCode = data.weather[0].icon;
      weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

      const now = new Date();
      dateElement.innerText = now.toDateString();

      updateBackground(data.weather[0].main); // Background change call
      saveRecentSearch(data.name);
    } else {
      errorMessage.classList.remove("hidden");
    }
  } catch (error) {
    loadingSpinner.classList.add("hidden");
    alert("⚠️ Internet error!");
  }
}

function saveRecentSearch(city) {
  if (!recentSearches.includes(city)) {
    recentSearches.unshift(city);
    if (recentSearches.length > 3) recentSearches.pop();
    localStorage.setItem("weatherSearches", JSON.stringify(recentSearches));
    renderRecentSearches();
  }
}

function renderRecentSearches() {
  recentSearchesContainer.innerHTML = "";
  recentSearches.forEach((city) => {
    const btn = document.createElement("button");
    btn.classList.add("recent-btn");
    btn.innerText = city;
    btn.addEventListener("click", () => {
      cityInput.value = city;
      getWeatherData(`q=${city}`);
    });
    recentSearchesContainer.appendChild(btn);
  });
}
