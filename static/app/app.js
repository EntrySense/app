let currentTab, protection = false

function renderTab(option, forceSwitch) {
    if (currentTab === option && !forceSwitch) return

    if (currentTab) document.getElementById(`sectionUnderline-${currentTab}`).style.width = "0"
    document.getElementById(`sectionUnderline-${option}`).style.width = "100%"
    currentTab = option

    switch (option) {
        case "account":
            document.getElementById("root").innerHTML = `
                <div class="accountContent">
                    <div class="accountCard">
                        <div class="avatarContainer">
                            <div class="avatar"></div>
                        </div>
                        <div class="promptContainer">
                            <p>Your Account</p>
                        </div>
                        <div class="formContainer">
                            <div>
                                <p>Full Name</p>
                                <input type="text" value="Name Surname" disabled />
                            </div>
                            <div>
                                <p>Email Address</p>
                                <input type="text" value="namesurname@gmail.com" disabled />
                            </div>
                            <div>
                                <p>Password</p>
                                <input type="password" value="Asdasd123$" disabled />
                            </div>
                        </div>
                    </div>
                </div>
            `
            break
        case "dashboard":
            document.getElementById("root").innerHTML = `
                <div class="dashboardContent">
                    <div class="protectionStatus">
                        <p class="message">Protection is</p>
                        <p class="status ${protection ? "statusOn" : "statusOff"}">${protection ? "ON" : "OFF"}</p>
                    </div>
                    <div class="protectionSwitch">
                        <input type="button" class="armButton" id="armButton" value="Arm Door" ${protection ? "disabled" : ""} />
                        <input type="button" class="disarmButton" id="disarmButton" value="Disarm Door" ${!protection ? "disabled" : ""} />
                    </div>
                    <p class="lastTrack">Last entrance tracked: DD/MM/YYYY HH:MM</p>
                </div>
            `

            document.getElementById("armButton").addEventListener("click", () => switchProtection(true))
            document.getElementById("disarmButton").addEventListener("click", () => switchProtection(false))

            break
        case "history":
            document.getElementById("root").innerHTML = `
                <p>This is History section</p>
            `
            break
    }
}

document.querySelector(".desktopMenu").addEventListener("click", (e) => {
  const item = e.target.closest(".sectionItem")
  if (!item) return
  renderTab(item.dataset.tab, false)
})

function switchProtection(option) {
    protection = option
    renderTab("dashboard", true)
}

renderTab("account", false)