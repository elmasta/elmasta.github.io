const svgns = "http://www.w3.org/2000/svg"
var loginform = document.getElementById("login")
var wrongCredential = document.getElementById("wrongCredential")
var main = document.querySelector("main")
var header = document.querySelector("header")

wrongCredential.style.display = "none"

loginform.addEventListener("submit", function(event) {
	event.preventDefault()
	let user = document.getElementById("username")
	let password = document.getElementById("password")
	let auth = base64Encode(user.value + ":" + password.value)

	let xhr = new XMLHttpRequest()
	xhr.open("POST", "https://zone01normandie.org/api/auth/signin")
	xhr.setRequestHeader("Authorization", "Basic " + auth)
	xhr.onload = () => {
		let token = JSON.parse(xhr.response)
		if (token.error) {
			wrongCredential.style.display = ""
		} else {
			wrongCredential.style.display = "none"
			header.innerHTML = ""

			//log out button
			const button = document.createElement("button")
			button.textContent = "Logout"
			header.appendChild(button)
			button.addEventListener("click", function() {
				window.location.reload()
			})
			
			graphRequest(token)
		}
	}
	xhr.send()
})

function base64Encode(str) {
	var utf8Bytes = new TextEncoder().encode(str)
	return btoa(String.fromCharCode.apply(null, utf8Bytes))
}

function graphRequest(token) {
	let xhr = new XMLHttpRequest()
	let body = JSON.stringify({
		query: `{
			user {
				attrs
			}
			transaction(order_by: {createdAt: asc}){
				object {
					id
				}
				type
				path
				amount
        		createdAt
				eventId
			}
		}`
	})
	xhr.open("POST", "https://zone01normandie.org/api/graphql-engine/v1/graphql")
	xhr.setRequestHeader("Authorization", "Bearer " + token)
	xhr.setRequestHeader("Content-Type", "application/json")
	xhr.onload = () => {
		var resp = JSON.parse(xhr.response)
		let total_xp = 0
		let level = 0
		let up = 0
		let down = 0
		let date_to_compare = new Date("2023-05-21T00:00:00.000000+00:00")
		let dateList = []
		dateList.push({date: new Date("2023-05-22T00:00:00.000000+00:00"), value: 0}) //beginning
		for (let i in resp.data.transaction) {
			let tmp_date = new Date(resp.data.transaction[i].createdAt)
			if (resp.data.transaction[i].type == "xp" && tmp_date > date_to_compare && resp.data.transaction[i].eventId != 103 && resp.data.transaction[i].eventId != 227) {
				total_xp += resp.data.transaction[i].amount
				dateList.push({date: tmp_date, value: resp.data.transaction[i].amount})
			} else if (resp.data.transaction[i].type == "level" && resp.data.transaction[i].eventId != 103 && resp.data.transaction[i].eventId != 227) {
				if (resp.data.transaction[i].amount > level) {
					level = resp.data.transaction[i].amount
				}
			} else if (resp.data.transaction[i].type == "up" && resp.data.transaction[i].eventId != 103 && resp.data.transaction[i].eventId != 227) {
				up += resp.data.transaction[i].amount
			} else if (resp.data.transaction[i].type == "down" && resp.data.transaction[i].eventId != 103 && resp.data.transaction[i].eventId != 227) {
				down += resp.data.transaction[i].amount
			}
		}
		let tmp_count = 0
		for (let i in dateList) {
			tmp_count += dateList[i].value
			dateList[i].value = tmp_count
		}
		dateList.push({date: new Date(), value: total_xp}) //today's date

		//top info creation
		let userInfo = document.getElementById("userInfo")
		let newDiv = document.createElement("div")
		newDiv.innerText = "User: " + resp.data.user[0].attrs.firstName + " " + resp.data.user[0].attrs.lastName
		userInfo.appendChild(newDiv)
		newDiv = document.createElement("div")
		newDiv.innerText = "XP: " + total_xp
		userInfo.appendChild(newDiv)
		newDiv = document.createElement("div")
		newDiv.innerText = "Level: " + level
		userInfo.appendChild(newDiv)
		newDiv = document.createElement("div")
		let ratio = Math.floor(up*100/down) * 0.01
		newDiv.innerText = "Ratio: " + ratio
		userInfo.appendChild(newDiv)
		

		//graph creation

		//first graph
		firstGraph = document.getElementById("ratioChart")
		var svgElement = document.createElementNS(svgns, "svg")
		svgElement.setAttribute("style", "border: 1px solid #000;")
		svgElement.setAttribute("width", "1000")
		svgElement.setAttribute("height", "60")
		firstGraph.appendChild(svgElement)

		var group = document.createElementNS("http://www.w3.org/2000/svg", "g")

		let topLine = document.createElementNS(svgns, "rect")
		topLine.setAttribute("x", 0)
		topLine.setAttribute("y", 0)
		if (up > down) {
			topLine.setAttribute("width", "1000")
			topLine.setAttribute("fill", "green")
		} else {
			if (ratio > 1) {
				topLine.setAttribute("width", Math.floor(down*100/up) * 10)
			} else {
				topLine.setAttribute("width", ratio*1000)
			}
			topLine.setAttribute("fill", "black")
		}
		topLine.setAttribute("height", "25")
		group.appendChild(topLine)

		var SVGText = document.createElementNS(svgns, "text")
		SVGText.setAttribute("x", "20")
		SVGText.setAttribute("y", "20")
		SVGText.setAttribute("font-family", "Arial")
		SVGText.setAttribute("font-size", "16")
		SVGText.setAttribute("fill", "white")
		SVGText.textContent = "Audit ratio given: " + Math.floor(up)
		group.appendChild(SVGText)

		svgElement.appendChild(group)

		group = document.createElementNS("http://www.w3.org/2000/svg", "g")

		let bottomLine = document.createElementNS(svgns, "rect")
		bottomLine.setAttribute("x", 0)
		bottomLine.setAttribute("y", 35)
		if (down > up) {
			bottomLine.setAttribute("width", "1000")
			bottomLine.setAttribute("fill", "red")
		} else {
			if (ratio > 1) {
				bottomLine.setAttribute("width", Math.floor(down*100/up) * 10)
			} else {
				bottomLine.setAttribute("width", ratio*1000)
			}
			bottomLine.setAttribute("fill", "black")
		}
		bottomLine.setAttribute("height", "25")
		group.appendChild(bottomLine)

		var SVGText = document.createElementNS(svgns, "text")
		SVGText.setAttribute("x", "20")
		SVGText.setAttribute("y", "55")
		SVGText.setAttribute("font-family", "Arial")
		SVGText.setAttribute("font-size", "16")
		SVGText.setAttribute("fill", "white")
		SVGText.textContent = "Audit ratio received: " + Math.floor(down)
		group.appendChild(SVGText)

		svgElement.appendChild(group)


		//second graph
		var margin = {top: 10, right: 30, bottom: 30, left: 60},
		width = 1400 - margin.left - margin.right,
		height = 700 - margin.top - margin.bottom

		const x = d3.scaleTime()
			.range([0, width])
		const y = d3.scaleLinear()
			.range([height, 0])

		const svg = d3.select("#chart")
		.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`)

		x.domain(d3.extent(dateList, d => d.date))
		y.domain([0, d3.max(dateList, d => d.value)])

		// x
		svg.append("g")
		.attr("transform", `translate(0,${height})`)
		.call(d3.axisBottom(x)
			.ticks(d3.timeMonth.every(1)) 
			.tickFormat(d3.timeFormat("%b %Y")))

		// y
		svg.append("g")
			.call(d3.axisLeft(y))

		const line = d3.line()
			.x(d => x(d.date))
			.y(d => y(d.value))

		svg.append("path")
			.datum(dateList)
			.attr("fill", "none")
			.attr("stroke", "red")
			.attr("stroke-width", 1)
			.attr("d", line)

	}
	xhr.send(body)
}
