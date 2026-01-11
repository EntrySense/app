let currentTab, protection = false

function renderTab(option, forceSwitch) {
    if (currentTab === option && !forceSwitch) return

    if (currentTab) document.getElementById(`sectionUnderline-${currentTab}`).style.width = "0"
    document.getElementById(`sectionUnderline-${option}`).style.width = "100%"
    currentTab = option

    switch (option) {
        case "account":
            document.getElementById("root").innerHTML = `
                <p>This is Account section</p>
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

renderTab("dashboard", false)