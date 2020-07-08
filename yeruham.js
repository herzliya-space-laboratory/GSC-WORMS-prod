const fs = require("fs");

const mib = {
	telemetry: {
		serviceTypes: [],
		calibrations: [],
	},
	telecommands: {
		serviceTypes: [],
		calibrations: [],
	},
};

const tx = JSON.parse(fs.readFileSync("./tx.json").toString());
const rx = JSON.parse(fs.readFileSync("./rx.json").toString());
let calTelemCounter = 1;
let calCommCounter = 1;

tx.types.forEach((st) => convertServiceType(st, "telecommands"));
rx.types.forEach((st) => convertServiceType(st, "telemetry"));

mib.telecommands.serviceTypes = tx.types;
mib.telemetry.serviceTypes = rx.types;

fs.writeFileSync("./yeruham.json", JSON.stringify(mib));

function convertServiceType(st, part) {
	delete st.desc;
	Object.defineProperty(
		st,
		"serviceSubTypes",
		Object.getOwnPropertyDescriptor(st, "subtypes")
	);
	delete st["subtypes"];
	st.serviceSubTypes.forEach((sst) => convertSST(sst, part));
}

function convertSST(sst, part) {
	delete sst.desc;
	Object.defineProperty(
		sst,
		"params",
		Object.getOwnPropertyDescriptor(sst, "inParams")
	);
	delete sst["inParams"];
	sst.params.forEach((param) => convertParam(param, part));
}

function convertParam(param, part) {
	Object.defineProperty(
		param,
		"description",
		Object.getOwnPropertyDescriptor(param, "desc")
	);
	delete param["desc"];
	param.type = convertType(param.type);
	param.isLittleEndian = true;

	if (param.values !== undefined) {
		const cal = convertEnumCal(param.values);
		delete param.values;
		if (part === "telemetry") {
			mib.telemetry.calibrations.push(cal);
			param.calibration = calTelemCounter++;
		} else {
			mib.telecommands.calibrations.push(cal);
			param.calibration = calCommCounter++;
		}
	}
}

function convertType(type) {
	switch (type) {
		case "char":
			return "byte";
		case "int":
			return "int32";
		case "short":
			return "int16";
		case "date":
		case "datetime":
			return "datetime";
		case "float":
			return "float";
		default:
			return type;
	}
}

function convertEnumCal(values, part) {
	let id = part === "telemetry" ? calTelemCounter : calCommCounter;
	const cal = {
		name: `cal${id}`,
		id: id,
		type: "options",
		options: values.map((item) => {
			return {
				value: parseInt(item.id),
				name: item.name,
			};
		}),
	};
	return cal;
}
