let currentTab, protection = false, lastEntrance = null, fullName = "", email = ""

function getInitials() {
    return fullName.trim().split(" ").map(word => word[0]).join("").toUpperCase()
}

function formatDateTimeDublin(isoString) {
    const d = new Date(isoString)
    if (Number.isNaN(d.getTime())) return "—"

    const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Dublin",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    })

    return fmt.format(d).replace(",", "")
}

async function loadLastEntrance() {
    const token = localStorage.getItem("token")
    const res = await fetch("/history/me/last-entrance", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to load last entrance")

    lastEntrance = data.record ? formatDateTimeDublin(data.record.created_at) : null
}

function formatHistoryDate(isoString) {
    const d = new Date(isoString)
    if (Number.isNaN(d.getTime())) return "—"

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(d).replace(",", "")
}

function formatHistoryDescription(event, description) {
    if (description) return description

    switch (event) {
        case "arm": return "System armed"
        case "disarm": return "System disarmed"
        case "open": return "Door opened"
        case "close": return "Door closed"
        default: return event
    }
}

async function loadHistory() {
    const token = localStorage.getItem("token")
    const res = await fetch("/history/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to load history")

    return data.records || []
}

async function renderTab(option, forceSwitch) {
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
                            <div class="avatar">
                                <p>${getInitials()}</p>
                            </div>
                        </div>
                        <div class="promptContainer">
                            <p>Your Account</p>
                        </div>
                        <div class="formContainer">
                            <div>
                                <p>Full Name</p>
                                <input type="text" id="nameDisplay" value="${fullName}" disabled />
                            </div>
                            <div>
                                <p>Email Address</p>
                                <input type="text" id="emailDisplay" value="${email}" disabled />
                            </div>
                            <div>
                                <p>Password</p>
                                <input type="password" value="SomePassword123$" disabled />
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
                    <p class="lastTrack">Last entrance tracked: ${lastEntrance ? lastEntrance : "Never"}</p>
                </div>
            `

            document.getElementById("armButton").addEventListener("click", () => switchProtection(true))
            document.getElementById("disarmButton").addEventListener("click", () => switchProtection(false))

            break
        case "history":
            let recordsList = "", records = []

            try {
                records = await loadHistory()
            } catch (e) {
                recordsList = `<p>Failed to load history</p>`
            }

            if (records.length) {
                for (const r of records) {
                    recordsList += `
                <div class="tableRecord">
                    <p class="recordDate">${formatHistoryDate(r.created_at)}</p>
                    <p class="recordDescription">
                        ${formatHistoryDescription(r.event, r.description)}
                    </p>
                </div>
            `
                }
            }

            document.getElementById("root").innerHTML = `
                <div class="historyContent">
                    <div class="historyList">
                        <p class="listTitle">Activity</p>
                        <div class="tableCategories">
                            <div><p>Time</p></div>
                            <div><p>Description</p></div>
                        </div>
                        <div class="recordsList">
                            ${recordsList}
                        </div>
                    </div>
                </div>
            `
            break
    }
}

document.querySelector(".desktopMenu").addEventListener("click", (e) => {
    const item = e.target.closest(".sectionItem")
    if (!item) return
    renderTab(item.dataset.tab, false)
})

async function switchProtection(option) {
    try {
        if (option) await armDevice()
        else await disarmDevice()

        protection = option
        renderTab("dashboard", true)
    } catch (e) {
        alert(e.message)
    }
}

async function loadProtectionStatus() {
    const token = localStorage.getItem("token")
    const res = await fetch("/devices/me/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to load status")

    protection = data.armed
}

async function armDevice() {
    const token = localStorage.getItem("token")
    const res = await fetch("/devices/me/arm", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to arm")
    return data
}

async function disarmDevice() {
    const token = localStorage.getItem("token")
    const res = await fetch("/devices/me/disarm", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to disarm")
    return data
}

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token")
    if (!token) {
        window.location.replace("/")
        return
    }

    const ok = await verifyToken(token)
    if (!ok) {
        localStorage.removeItem("token")
        window.location.replace("/")
    }

    const res = await fetch("/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()

    fullName = data.account.full_name
    email = data.account.email

    await loadProtectionStatus()
    await loadLastEntrance()
    renderTab("dashboard", true)
})

async function verifyToken(token) {
    const res = await fetch("http://127.0.0.1:8000/auth/me", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    return res.ok
}