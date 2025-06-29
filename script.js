// Define dropdown values
const rooms = ["201 - 2nd Floor", "202 - 2nd Floor", "401 - 4th Floor", "402 - 4th Floor"];
const semesters = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
const branches = ["CSE", "ISE", "EEE", "ECE", "ME", "CV"];
const slots = ["8:30 AM - 9:30 AM", "11:00 AM - 1:00 PM", "2:00 PM - 4:00 PM"];

const form = document.getElementById("bookingForm");
const msg = document.getElementById("msg");
const list = document.getElementById("bookingList");
const facultyName = localStorage.getItem("facultyName");
const facultyId = localStorage.getItem("facultyId");
const adminId = "admin001";
const isAdmin = facultyId === adminId;

if (!facultyName || !facultyId) {
  alert("Login required");
  window.location.href = "login.html";
} else {
  document.getElementById("facultyDetails").innerText = Logged in: ${facultyName} (ID: ${facultyId});
  if (isAdmin) {
    document.getElementById("adminControls").style.display = "block";
  }
}

populateDropdown("room", rooms);
populateDropdown("semester", semesters);
populateDropdown("branch", branches);
populateDropdown("slot", slots);
populateDateDropdown();
checkMonthReset();
displayBookings();

function populateDropdown(id, options) {
  const dropdown = document.getElementById(id);
  dropdown.innerHTML = <option value="">Select ${id.charAt(0).toUpperCase() + id.slice(1)}</option>;
  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = id === "room" ? opt.split(" ")[0] : opt;
    option.innerText = opt;
    dropdown.appendChild(option);
  });
}

function populateDateDropdown() {
  const dropdown = document.getElementById("date");
  dropdown.innerHTML = <option value="">Select Date</option>;
  const today = new Date();
  let count = 0, offset = 0;

  while (count < 14) {
    const date = new Date();
    date.setDate(today.getDate() + offset);
    if (date.getDay() !== 0) {
      const dateStr = date.toISOString().split("T")[0];
      const option = document.createElement("option");
      option.value = dateStr;
      option.innerText = date.toDateString();
      dropdown.appendChild(option);
      count++;
    }
    offset++;
  }
}

function checkMonthReset() {
  const lastReset = localStorage.getItem("lastReset");
  const now = new Date();
  if (!lastReset || new Date(lastReset).getMonth() !== now.getMonth()) {
    localStorage.setItem("bookings", JSON.stringify([]));
    localStorage.setItem("lastReset", now.toISOString());
  }
}

function displayBookings() {
  const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  list.innerHTML = "";
  bookings.forEach((b, index) => {
    const li = document.createElement("li");
    li.innerText = ${b.facultyName} | ${b.subject} | Room ${b.room} | ${b.slot} | ${b.date};

    if (b.facultyId === facultyId || isAdmin) {
      const cancelBtn = document.createElement("button");
      cancelBtn.innerText = "Cancel";
      cancelBtn.style.marginLeft = "10px";
      cancelBtn.onclick = () => cancelBooking(index);
      li.appendChild(cancelBtn);
    }

    list.appendChild(li);
  });
}

function cancelBooking(index) {
  const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  if (confirm("Are you sure you want to cancel this booking?")) {
    bookings.splice(index, 1);
    localStorage.setItem("bookings", JSON.stringify(bookings));
    displayBookings();
    msg.innerText = "✅ Booking cancelled.";
    msg.style.color = "green";
  }
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const room = document.getElementById("room").value;
  const date = document.getElementById("date").value;
  const slot = document.getElementById("slot").value;
  const semester = document.getElementById("semester").value;
  const branch = document.getElementById("branch").value;
  const subject = document.getElementById("subject").value.trim();

  if (!room || !date || !slot || !semester || !branch || !subject) {
    msg.innerText = "⚠ All fields are required.";
    msg.style.color = "red";
    return;
  }

  if (new Date(date).getDay() === 0) {
    msg.innerText = "⚠ Sunday bookings are not allowed.";
    msg.style.color = "red";
    return;
  }

  const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  const month = new Date(date).getMonth();
  const year = new Date(date).getFullYear();

  const countThisMonth = bookings.filter(b => b.facultyId === facultyId && new Date(b.date).getMonth() === month && new Date(b.date).getFullYear() === year).length;

  if (countThisMonth >= 3) {
    msg.innerText = "⚠ Limit: 3 bookings per month.";
    msg.style.color = "red";
    return;
  }

  if (bookings.some(b => b.room === room && b.date === date && b.slot === slot)) {
    msg.innerText = "⚠ Slot already booked.";
    msg.style.color = "red";
    return;
  }

  bookings.push({ facultyName, facultyId, room, date, slot, semester, branch, subject });
  localStorage.setItem("bookings", JSON.stringify(bookings));

  msg.innerText = "✅ Booking Confirmed!";
  msg.style.color = "green";
  form.reset();
  displayBookings();
});

function logout() {
  localStorage.removeItem("facultyName");
  localStorage.removeItem("facultyId");
  window.location.href = "login.html";
}

function downloadCSV() {
  const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  if (bookings.length === 0) {
    alert("No bookings to download.");
    return;
  }

  const csvRows = [["Faculty Name", "Branch", "Semester", "Subject", "Room", "Date", "Slot"]];
  bookings.forEach(b => {
    csvRows.push([b.facultyName, b.branch, b.semester, b.subject, b.room, b.date, b.slot]);
  });

  const csvContent = csvRows.map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bookings.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function clearAllBookings() {
  const pin = prompt("Enter admin PIN to clear all bookings:");
  if (pin === "1234") {
    if (confirm("Are you sure you want to delete ALL bookings?")) {
      localStorage.setItem("bookings", JSON.stringify([]));
      displayBookings();
      alert("✅ All bookings cleared.");
    }
  } else {
    alert("❌ Incorrect PIN. Access denied.");
  }
}