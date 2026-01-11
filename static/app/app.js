let currentTab

document.querySelector(".desktopMenu").addEventListener("click", (e) => {
  const item = e.target.closest(".sectionItem")
  if (!item) return
  switchTab(item.dataset.tab)
})

function switchTab(option) {
    if (currentTab === option) return

    if (currentTab) document.getElementById(`sectionUnderline-${currentTab}`).style.width = "0"
    document.getElementById(`sectionUnderline-${option}`).style.width = "100%"
    currentTab = option

    switch (option) {
        case "account":
            console.log("Switched to Account section")
            break
        case "dashboard":
            console.log("Switched to Dashboard section")
            break
        case "history":
            console.log("Switched to History section")
            break
    }
}

switchTab("dashboard")