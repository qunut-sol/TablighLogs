const URL = 'https://script.google.com/macros/s/AKfycbxT7v5uP0IDNKJFLHJgZ8bY3BNFX_RbvDXUusIFVpoc9VOj8RM5rWAwPpOD_s9WzJ9GvQ/exec';
const currentPage = window.location.pathname.split("/").pop();
let sheetsData;
let monthlyData;
let weeklyData;
let userCreds;
let masjids;
let loggedInUser;
let LatestWeeklyEntry;
let LatestJamatDate;
let LatestSingleDayMasjids;
let LatestThreeDayMasjids;

// Communicate with Google Sheet / Apps Script
async function callAppsScriptFunction(payload){
    const response = await fetch(URL, {
        redirect: "follow",
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
    })
    .catch(error => {
        console.error('Error: ', error);
    });
    return await response.json();
}

$(document).ready(async function () { 
    console.log("hi");
    // Prepare the payload for the POST request
    const payload = { action: 'getSheetsData' };
    sheetsData = await callAppsScriptFunction(payload);

    monthlyData = sheetsData[0].data;

    weeklyData = sheetsData[1].data;
    LatestWeeklyEntry = weeklyData[2];
    LatestJamatDate = dateFormatChange(LatestWeeklyEntry[0]);
    LatestSingleDayMasjids = LatestWeeklyEntry[1];
    LatestThreeDayMasjids = LatestWeeklyEntry[2];

    userCreds = sheetsData[2].data.slice(1);
    users = userCreds.map(row => row[0]);
    masjids = users.slice(1);
    
    loadPageSpecificFunctions();
    setFavicon();
});

// On page load, check if a user is logged in
function checkIfLogged () {
    loggedInUser = localStorage.getItem('loggedInUser');    
    if (isUnauthorized(currentPage, loggedInUser)) {
        window.location.href = 'index.html';       
    }
}

function isUnauthorized(currentPage, loggedInUser) {
    if (!loggedInUser) return true;
    if (currentPage.includes('Markaz') && !loggedInUser.includes('Markaz')) return true;
    if (currentPage.includes('Masjid') && !loggedInUser.includes('Masjid')) return true;
    return false;
  }

// Logout function
function logout() {
    // Clear session
    localStorage.removeItem('loggedInUser');

    // Redirect to login page
    window.location.href = 'index.html';
}

function setFavicon(){
        var link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = './assets/images/2303247_architect_dome_masjid_mosque_ramadhan_icon.svg';
}

async function loadPageSpecificFunctions() {
    if (currentPage.includes("Masjid") || currentPage.includes("Markaz")) {
        await loadCommonFunctionsForMarkazAndMasjid();
        if (currentPage.includes("Masjid")) {
            loadMasjidFunctions();
        } else if (currentPage.includes("Markaz")) {
            loadMarkazFunctions();
        }
    } else if (currentPage.includes("index")) {
        loadIndexFunctions(); //for login page
    }
}

function loadIndexFunctions() {
    addUsersInDD();
    login();
}

function login(){    
    // Login form submission
    document.getElementById("loginForm").onsubmit = async function (event) {
        event.preventDefault();  // Prevent default form submission
    
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
    
        try {
            // Check if user exists and password matches
            const user = userCreds.find(user => user[0] === username);
    
            if (!user) {
                showError("User does not exist.");
            } else if (String(user[1]) !== password) {
                showError("Incorrect password.");
            } else {
                localStorage.setItem("loggedInUser", username);
                if(username.includes("Masjid")){            
                    window.location.href = "Masjid Admin.html";  
                } else {
                    window.location.href = "Markaz Admin.html"
                }
            }
        } catch (error) {
            showError("Error fetching user data. Please try again.");
        }
    };
}

async function loadCommonFunctionsForMarkazAndMasjid() {

    loggedInUser = localStorage.getItem('loggedInUser');    
    if (isUnauthorized(currentPage, loggedInUser)) {
        window.location.href = 'index.html';       
    }

    await loadOtherHTML("Monthly Report.html");
    await loadOtherHTML("Monthly Form.html");

    addMasjidsInDD();

    hide(['fullFormMonthly']);

    DisableLastCheckUnselection();

    document.getElementById("openMonthlyFormBtn").addEventListener("click",function(){
        //for Masjid Admin
        hide(['filter-dashboard-container']);
        show(['fullFormMonthly']);
    });

    document.getElementById("closeMonthlyForm").addEventListener("click",function(){
        hide(['fullFormMonthly']);
        show(['filter-dashboard-container']);
    });

    document.getElementById("shareLatestOnWAanchor").addEventListener("click",function(event){
        event.preventDefault(); // Prevent default navigation
        const arrayLatestSingleDayMasjids = LatestSingleDayMasjids!="" ? LatestSingleDayMasjids.split(", ") : ['None'];
        const arrayLatestThreeDayMasjids = LatestThreeDayMasjids!="" ? LatestThreeDayMasjids.split(", ") : ['None'];
        sendOnWA(LatestJamatDate, arrayLatestSingleDayMasjids, arrayLatestThreeDayMasjids);
    });

    onMonthlyFormSubmit();
}

function DisableLastCheckUnselection(){
    //Disable unselecting last checkbox
    $('input[type="checkbox"]').click(function() {
        var inputValue = $(this).attr("value"); 
    
        // Check the number of checkboxes that are checked
        var checkedCount = $('input[type="checkbox"]:checked').length;
    
        // If no checkbox is checked, re-check this one and show an alert
        if (checkedCount === 0) {
            $(this).prop('checked', true);
            alert("At least one checkbox must remain checked.");
        } else{
            $("." + inputValue).toggle();
        }
    });
}

function loadMasjidFunctions() {
    console.log(" for Masjid.html");
    // Add specific functions for Masjid.html here
    //Set up for Masjid--------------------

    preSelectLoggedMasjid();

    setHeaderFunctions("Masjid");

    setUpLatestJamatCard();

    document.getElementById("openMonthlyFormBtn").addEventListener("click",function(){
        hide(['tarteebCard','monthlyReportHeading4Masjid','whatsAppShareContainer']);//add h3 after assinging id
    });

    document.getElementById("closeMonthlyForm").addEventListener("click",function(){
        show(['tarteebCard','monthlyReportHeading4Masjid','whatsAppShareContainer']);
    });

    //hide search by Masjid bar
    document.getElementById('searchByMasjid').classList.add('displayOff');    
                    
}

function loadMarkazFunctions() {

    setHeaderFunctions("Markaz");

    hide(['filter-dashboard-container']);

    document.getElementById("monthly-report-tab-title").addEventListener("click",function(){
        hide(['weekly-filter-report-container']);
        show(['filter-dashboard-container']);
        document.getElementById('weekly-report-tab-title').classList.add('dim');
        document.getElementById('monthly-report-tab-title').classList.remove('dim');
    });

    document.getElementById("weekly-report-tab-title").addEventListener("click",function(){
        hide(['filter-dashboard-container']);
        show(['weekly-filter-report-container']);
        document.getElementById('weekly-report-tab-title').classList.remove('dim');
        document.getElementById('monthly-report-tab-title').classList.add('dim');
    });

    document.getElementById("openWeeklyFormBtn").addEventListener("click",function(){
        hide(['tabs','weekly-filter-report-container']);
        show(['weeklyFormMasterContainer']);
    });

    document.getElementById("closeWeeklyForm").addEventListener("click",function(){
        hide(['weeklyFormMasterContainer']);
        show(['tabs','weekly-filter-report-container']);
    });

    onWeeklyFormSubmit();

    document.getElementById("openMonthlyFormBtn").addEventListener("click",function(){
        hide(['tabs']);
    });

    document.getElementById("closeMonthlyForm").addEventListener("click",function(){
        show(['tabs']);
    });

    // On an +svg click
    document.addEventListener("click", (event) => {
        // Check if the clicked element is an SVG
        const svg = event.target.closest("svg");
        if (svg) {
            // Find the closest parent container (parent of the SVG)
            const parentDiv = svg.closest("div");
            
            // Find the parent of that parentDiv (the main container)
            const mainContainer = parentDiv?.parentElement;

            if (parentDiv && mainContainer) {
                // Clone the parentDiv
                const clonedElement = parentDiv.cloneNode(true);

                // const firstChildDiv = clonedElement.querySelector("div:nth-child(1)");
                // const secondChildDiv = clonedElement.querySelector("div:nth-child(2)");
                // if (firstChildDiv && secondChildDiv) {
                //     firstChildDiv.textContent = ""; // Set the first element text to empty
                //     secondChildDiv.textContent = "&"; // Set the second element text to "&"
                // }

                console.log(parentDiv.closest("fieldset"));

                if (parentDiv.closest("fieldset")){
                    // Increment the Rukh number in the first child <div>
                    const currentRukhText = clonedElement.firstElementChild.textContent;
                    const currentRukhNumber = parseInt(currentRukhText.match(/\d+/)[0], 10);
                    const newRukhNumber = currentRukhNumber + 1;
                    clonedElement.firstElementChild.textContent = `• Rukh ${newRukhNumber}:`;  
                } else{
                    // Special handling for the Khidmat section
                    clonedElement.querySelector("div:nth-child(1)").textContent = "";
                    clonedElement.querySelector("div:nth-child(2)").textContent = "&";
                }

                // Append the cloned element to the main container
                mainContainer.appendChild(clonedElement);

                // Remove only the clicked SVG
                svg.remove();
            }
        }
    });
}

function setUpLatestJamatCard(){
    document.getElementById("latestJamatDate").textContent = LatestJamatDate;
    populateMasjidsList(LatestSingleDayMasjids, "singleDayMasjidsUL");
    populateMasjidsList(LatestThreeDayMasjids, "threeDayMasjidsUL");
}

// Helper function to populate a <ul> with masjids
function populateMasjidsList(masjids, ulElementId) {
    const ulElement = document.getElementById(ulElementId);
    if (masjids.trim() === "") {
        // Add "None" if the string is empty
        const li = document.createElement("li");
        li.textContent = "None";
        ulElement.appendChild(li);
    } else {
        // Split the string and create <li> elements for each masjid
        const masjidArray = masjids.split(", ");
        masjidArray.forEach(masjid => {
        const li = document.createElement("li");
        li.textContent = masjid;
        ulElement.appendChild(li);
        });
    }
}

//add Masjids in dropdown
function addMasjidsInDD(){
    
    // Select all <select> elements with class "masjidDropdown"
    const dropdowns = document.querySelectorAll("select.masjidDropdown");

    // Loop through each <select> element
    dropdowns.forEach(dropdown => {        
        // Loop through the optionsArray and add each as an <option>
        masjids.forEach(optionText => {
            const option = document.createElement("option");
            option.value = optionText;
            option.textContent = optionText;
            dropdown.appendChild(option);
        });
    });
}

//add users in dropdown
function addUsersInDD(){
        // Loop through the optionsArray and add each as an <option>
        users.forEach(optionText => {
            const option = document.createElement("option");
            option.value = optionText;
            option.textContent = optionText;
            document.getElementById('username').appendChild(option);
        });        
        
        //Remove wait option
        document.getElementById('waitForList').remove();
}

function showError(message) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    errorMessage.style.backgroundColor = "red"; // Set background color to red
    errorMessage.style.color = "white"; // Ensure text is readable
    errorMessage.style.padding = "10px"; // Add padding for better appearance
    errorMessage.style.borderRadius = "5px"; // Add rounded corners
    errorMessage.style.textAlign = "center"; // Center align text

    // Hide the error message after 3 seconds
    setTimeout(() => {
        errorMessage.style.display = "none";
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
    }, 3000); // 3000 milliseconds = 3 seconds
}

// Function to load content from another HTML Page 
async function loadOtherHTML(htmlName) {
    try {
      // Use fetch to get the content of Page 
      const response = await fetch(htmlName);
      
      // Check if the response is okay (status in the range 200-299)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      // Convert the response to text
      const data = await response.text();
      
        // Append the required html content into the primary content opened in browser
        var z = document.createElement('div'); // is a node
        z.innerHTML = data;
        document.body.appendChild(z);
  
      // Return a success signal
      return true; 
  
    } catch (error) {
      console.error("Error loading other Page content:", error);
      throw error; // Rethrow the error to be caught by the caller
    }
}

function setHeaderFunctions(user_type){
    const iframe = document.querySelector("#headerFrame");
    iframe.src = "Header.html?v=" + new Date().getTime(); // browser-cache-busting query string

    // console.log(iframe.readyState);

    iframe.onload = () => {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        const svgAndUser = iframeDocument.getElementById("svgAndUserContainer");
        const logoutBtn = iframeDocument.getElementById("logout");

        //set usertype as Masjid or Markaz
        iframeDocument.getElementById("masjidOrMarkaz").innerHTML = user_type;

        // make it visible
        svgAndUser.classList.remove("hideVisibility");
        
        //make logout button visible on user click
        svgAndUser.addEventListener("click",function(){
            logoutBtn.classList.remove('displayOff');
        });
        //logout
        logoutBtn.addEventListener("click",function(){
            logout();        
        })
        // hide Logout button if clicking elsewhere than loogout
        $(document).click(function(event){ 
            if (!$(event.target).is(logoutBtn) && !logoutBtn.classList.contains('displayOff')) {               
                logoutBtn.classList.add('displayOff');
            }
        });

        //home
        iframeDocument.getElementById("appName").addEventListener("click",function(){
            location.reload();
        });
    };
}

// Helper function to check if a value is a valid date string
function isValidDate(value) {
    const date = new Date(value);
    return !isNaN(date.getTime()) && typeof value === 'string' && value.includes('-'); // Ensure it's a string and resembles a date
}

function dateFormatChange(dateInput){
    // Create a Date object from the input value
    const date = new Date(dateInput);

    //get the desired format
    const formattedDate = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(date);

    return formattedDate;
}

function hide(e){
    e.forEach(element => {
        document.getElementById(element).classList.add("displayOff"); 
        // console.log(document.getElementById(element));   
    });
}

function show(e){
    e.forEach(element => {
           document.getElementById(element).classList.remove("displayOff");   
    });
}

function preSelectLoggedMasjid(){
    // Check if the option exists
    const selectElement = document.getElementById("masjidDD");
    for (let option of selectElement.options) {
        if (option.value === loggedInUser) {
            // If found, select the option
            option.selected = true; // Highlight or select the option
            break; // Exit the loop once found
        }
    }    
    selectElement.setAttribute("readonly", "true"); // Prevent changes but keep it in FormData
}

function onMonthlyFormSubmit(){
    // Monthly Form Submission
    document.getElementById('monthlyForm').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form from submitting the traditional way

        // Collect form data into an object
        const formData = new FormData(this);
        let valuesArray = Array.from(formData.values());
        valuesArray = moveIndicesToEnd(valuesArray, [31,33,35,36]);
        valuesArray[0] = dateFormatChange(valuesArray[0]);


        // Prepare the payload for the POST request
        const payload = {
            action: 'addRow',
            sheetName: 'Monthly Log Master', // Specify your target sheet name here
            beforeRowNo: 4,
            values: valuesArray
        };

        addRow(payload);

    });
}

function moveIndicesToEnd(arr, indices) {
    let moved = [];
    let remaining = arr.filter((_, i) => {
        if (indices.includes(i)) {
            moved.push(arr[i]); // Collect elements to move
            return false; // Remove from the remaining list
        }
        return true;
    });
    return [...remaining, ...moved]; // Append moved elements at the end
}

function addRow(payload){
        // Send the data to your Apps Script web app endpoint
        callAppsScriptFunction(payload)
        .then(data => {
            if (data.status === 'success') {
                alert('Form submitted successfully');
                location.reload();
            } else {
                alert('An error occurred while submitting.')
                console.error('Error adding row:', data.message);
            }
        })
}

function onWeeklyFormSubmit(){
    document.getElementById("WeeklyForm").addEventListener("submit",function(event){
        event.preventDefault(); // Prevent form from submitting the traditional way

        // Collect form data into an object
        const formData = new FormData(this);
        // Convert FormData to an array
        const valuesArrayActual = Array.from(formData.values()).map(value => {
            // Check if the value is a valid date
            if (isValidDate(value)) {
                // Reformat the date if valid
                return dateFormatChange(value);
            }
            // Return the original value for non-date fields
            return value;
        });

        // Initialize an array for the result
        const formDataArray = [];

        // 1. Get the Date value
        const dateValue = dateFormatChange(document.getElementById("weeklyDate").value);
        formDataArray.push(dateValue);

        // Single Day Jamat - Combine all selected masjid values into one
        const singleDayMasjids = Array.from(
            document.querySelectorAll("#singleDayFieldset select")
        ).map((select) => select.value).filter((value) => value);
        formDataArray.push(singleDayMasjids.join(", ") );

        // Three Days Jamat - Combine all selected masjid values into one
        const threeDaysMasjids = Array.from(
            document.querySelectorAll("#threeDaysFieldset select")
        ).map((select) => select.value).filter((value) => value);
        formDataArray.push(threeDaysMasjids.join(", "));

        // Get all input[type="text"] elements within the form
        const textInputs = document.querySelectorAll("#WeeklyForm input[type='text']");
        // Map their values into an array
        const textInputValues = Array.from(textInputs).map(input => input.value);
        // Push the array to formData
        formDataArray.push(...textInputValues);

        // 7. Khidmat by - Combine all selected values into one
        const khidmatMasjids = Array.from(
            document.querySelectorAll(".weekly.sub.section.second select")
        ).map((select) => select.value).filter((value) => value);
        formDataArray.push(khidmatMasjids.join(", "));

        // Prepare the payload for the POST request
        const payload = {
            action: 'addRow',
            sheetName: 'Weekly Log Master', // Specify your target sheet name here
            beforeRowNo: 3,
            values: formDataArray
        };

        addRow(payload);

        whatsAppWeeklySubmit(dateValue, singleDayMasjids, threeDaysMasjids);
    });    
}

function whatsAppWeeklySubmit(date, singleDayMasjids, threeDaysMasjids){
    document.getElementById('unblurred').classList.remove('displayOff');
    
    var foo = document.createElement('div');
    foo.innerHTML = date;
    document.getElementById('popUpTitle').insertAdjacentElement("afterend",foo);
    foo.style.marginBottom="10px";

    // Append for singleDayMasjids
    appendListItems(singleDayMasjids, "1-dayRukhsUL");
    // Append for threeDaysMasjids
    appendListItems(threeDaysMasjids, "3-dayRukhsUL");

    document.getElementById("whatsAppYes").addEventListener("click",function(){
        sendOnWA(date, singleDayMasjids, threeDaysMasjids);
        location.reload();
    });

    document.getElementById("whatsAppNo").addEventListener("click",function(){
        location.reload();
    }); 
}

// Function to append list items to a UL element
function appendListItems(array, ulId) {
    const ulElement = document.getElementById(ulId);
    
    // Clear the UL element (if needed)
    ulElement.innerHTML = "";
  
    if (array.length === 0) {
      // Add "none" if the array is empty
      const li = document.createElement("li");
      li.textContent = "none";
      ulElement.appendChild(li);
    } else {
      // Add items from the array
      array.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        ulElement.appendChild(li);
      });
    }
}

function sendOnWA(date, singleDayMasjids, threeDaysMasjids){

    const singleDayList = singleDayMasjids.length
        ? singleDayMasjids.map(item => `• ${item}`).join("\n")
        : "• None";

    const threeDaysList = threeDaysMasjids.length
        ? threeDaysMasjids.map(item => `• ${item}`).join("\n")
        : "• None";

    // Step 2: Format the message
    const message = `*Latest Jamat Tarteeb*\n\n*Date:* ${date}\n\n*Single Day Jamat:*\n${singleDayList}\n\n*Three Days Jamat:*\n${threeDaysList}`;
            
    let urlForWA = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    // Open the WhatsApp URL to send the message
    window.open(urlForWA, '_blank');}

function sectionChange(openSec) {
    //default clear section bg color 
    var openDiv = document.getElementById('sectionsContainer');                       
    openDiv.classList.remove("bgForSec1","bgForSec2","bgForSec3");            
    //default visibility off
    const sections = ['section1Container','section2Container','section3Container'];
    for (const section of sections) {
        var div = document.getElementById(section);
        div.style.display = 'none';
    }
    //default size of dot 
    var dots = document.getElementsByClassName('sectionDot');
    for (const dot of dots){
        console.log(dot.classList);
        dot.classList.remove("openedSecDot");
    }
    //default size of section number 
    var secNumb = document.getElementsByClassName('secNum');
    for (const secNu of secNumb){
        secNu.classList.remove("openedSecName");
    }    

    if (openSec=='openSec2') {
        //set background color as per opened section
        openDiv.classList.add("bgForSec2");
        //make that section div visible 
        var div = document.getElementById('section2Container');
        //magnify relevant section dot
        document.getElementById('dot2').classList.add("openedSecDot");
        //magnify font size of relevant section number
        document.getElementById('sec2Name').classList.add("openedSecName");
    } else if(openSec=='openSec3'){
        openDiv.classList.add("bgForSec3");
        var div = document.getElementById('section3Container');                
        document.getElementById('dot3').classList.add("openedSecDot");
        document.getElementById('sec3Name').classList.add("openedSecName");
    } else {
        openDiv.classList.add("bgForSec1");
        var div = document.getElementById('section1Container');                
        document.getElementById('dot1').classList.add("openedSecDot");
        document.getElementById('sec1Name').classList.add("openedSecName");
    }
    div.style.display = 'block';
}

let currentAudio = null; // Tracks the currently playing audio
let currentFileName = ''; // Tracks the current file name
let currentElement = null; // Tracks the currently toggled element (play/pause)

function play(element, fileName) {
    // If the same file is clicked
    if (currentFileName === fileName) {
        if (currentAudio.paused) {
            currentAudio.play(); // Resume audio
            toggleIcon(element, true); // Show pause icon
        } else {
            currentAudio.pause(); // Pause audio
            toggleIcon(element, false); // Show play icon
        }
    } else {
        // Stop the current audio if any
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0; // Reset to the beginning
            if (currentElement) toggleIcon(currentElement, false); // Reset icon to play
        }

        // Play the new audio
        currentAudio = new Audio(`./assets/audios/${fileName}.mp3`);
        currentFileName = fileName;
        currentElement = element; // Update the current element reference
        currentAudio.play();
        toggleIcon(element, true); // Show pause icon

        // Reset audio and icon when it finishes playing
        currentAudio.addEventListener('ended', () => {
            toggleIcon(element, false); // Reset to play icon
            currentAudio = null;
            currentFileName = '';
            currentElement = null;
        });
    }
}

// Helper function to toggle between play and pause icons
function toggleIcon(element, isPlaying) {
    element.innerHTML = isPlaying
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause-circle" viewBox="0 0 16 16">
             <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
             <path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0z"/>
          </svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16">
             <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
             <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445"/>
          </svg>`;
}


