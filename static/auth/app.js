let currentForm = 0, nameValue = "", emailValue = "", passwordValue = "", confirmPasswordValue = ""

function handleInput(e) {
    switch (e.target.id) {
        case "emailField":
            emailValue = e.target.value
            break
        case "passwordField":
            passwordValue = e.target.value
            break
        case "nameField":
            nameValue = e.target.value
            break
        case "confirmPasswordField":
            confirmPasswordValue = e.target.value
            break
    }
}

function handleSubmit(e) {
    e.preventDefault()

    if (currentForm === 2) {
        signUp()
    } else {
        signIn()
    }
}

async function signUp() {
    try {
        const res = await fetch("http://127.0.0.1:8000/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                full_name: nameValue,
                email: emailValue,
                password: passwordValue
            }),
        })

        const data = await res.json()

        if (!res.ok) {
            console.error(data.error || "Request failed")
            return
        }

        window.location.reload()
    } catch (err) {
        console.error("Fetch error:", err)
    }
}

async function signIn() {
    try {
        const res = await fetch("http://127.0.0.1:8000/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: emailValue,
                password: passwordValue
            }),
        })

        const data = await res.json()

        if (!res.ok) {
            console.error(data.error || "Login failed")
            return
        }

        localStorage.setItem("token", data.token)
        window.location.href = "/app"
    } catch (err) {
        console.error("Fetch error:", err)
    }
}

function switchForms() {
    let form =
        `
        <div>
            <p>Email Address</p>
            <input type="text" id="emailField" value="${emailValue}" />
        </div>
        <div>
            <p>Password</p>
            <input type="password" id="passwordField" value="${passwordValue}" />
        </div>
    `

    if (currentForm === 1) {
        currentForm = 2
        form =
            `
            <div>
                <p>Full Name</p>
                <input type="text" id="nameField" value="${nameValue}" />
            </div>
        ` + form + `
            <div>
                <p>Confirm Password</p>
                <input type="password" id="confirmPasswordField" value="${confirmPasswordValue}" />
            </div>
        `

        document.getElementById("authCard").style.height = "1000px"
        document.getElementById("authForm").style.height = "550px"
        document.getElementById("authForm").innerHTML = form
        document.getElementById("prompt").textContent = "Create Account"
        document.getElementById("actionButton").value = "Create Account"
        document.getElementById("formSwitchPrompt").textContent = "Already have an account?"
        document.getElementById("formSwitcher").textContent = "Sign in"
    }
    else {
        currentForm = 1
        document.getElementById("authCard").style.height = "750px"
        document.getElementById("prompt").textContent = "Welcome Back"
        document.getElementById("authForm").style.height = "300px"
        document.getElementById("authForm").innerHTML = form
        document.getElementById("actionButton").value = "Sign In"
        document.getElementById("formSwitchPrompt").textContent = "Do not have an account?"
        document.getElementById("formSwitcher").textContent = "Sign up"
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token")

    if (token) {
        const ok = await verifyToken(token)

        if (ok) {
            window.location.replace("/app")
            return
        }
        else localStorage.removeItem("token")
    }

    document.getElementById("authForm").addEventListener("input", handleInput)
    document.getElementById("actionButton").addEventListener("click", handleSubmit)
    document.getElementById("formSwitcher").addEventListener("click", (e) => {
        e.preventDefault()
        switchForms()
    })

    switchForms()
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
