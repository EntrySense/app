let currentForm = 1, nameValue = "", emailValue = "", passwordValue = "", confirmPasswordValue = ""

async function signUp() {
    try {
        const res = await fetch("http://127.0.0.1:8000/accounts", {
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

        console.log("Account created:", data.account_id)

    } catch (err) {
        console.error("Fetch error:", err)
    }
}

document.getElementById("formSwitcher").addEventListener("click", function (e) {
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

    e.preventDefault()

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
        </div>`

        document.getElementById("authCard").style.height = "1000px"
        document.getElementById("authForm").style.height = "550px"
        document.getElementById("authForm").innerHTML = form
        document.getElementById("prompt").textContent = "Create Account"
        document.getElementById("actionButton").value = "Create Account"
        document.getElementById("formSwitchPrompt").textContent = "Already have an account?"
        document.getElementById("formSwitcher").textContent = "Sign in"

        document.getElementById("nameField").addEventListener("input", (e) => {
            nameValue = e.target.value
        })

        document.getElementById("confirmPasswordField").addEventListener("input", (e) => {
            confirmPasswordValue = e.target.value
        })

        document.getElementById("actionButton").addEventListener("click", async () => { signUp() })
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

    document.getElementById("emailField").addEventListener("input", (e) => {
        emailValue = e.target.value
    })

    document.getElementById("passwordField").addEventListener("input", (e) => {
        passwordValue = e.target.value
    })
})
