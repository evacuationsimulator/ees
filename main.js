(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["main"],{

/***/ "../shared/src/file-provider/interfaces.ts":
/*!*************************************************!*\
  !*** ../shared/src/file-provider/interfaces.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// From directory-tree npm package
class DirectoryTree {
    constructor() {
        this.location = FileLocation.MasterJob;
    }
}
exports.DirectoryTree = DirectoryTree;
class DirectoryTreeFile extends DirectoryTree {
    constructor() {
        super(...arguments);
        this.type = "file";
    }
}
exports.DirectoryTreeFile = DirectoryTreeFile;
class DirectoryTreeDirectory extends DirectoryTree {
    constructor() {
        super(...arguments);
        this.type = "directory";
    }
}
exports.DirectoryTreeDirectory = DirectoryTreeDirectory;
exports.isValidDirectoryTree = (dirTree) => typeof dirTree !== "undefined" &&
    dirTree !== null &&
    typeof dirTree.path !== "undefined";
var FileLocation;
(function (FileLocation) {
    FileLocation["MasterJob"] = "master-job";
    FileLocation["MasterTemplate"] = "master-template";
    FileLocation["MasterPrivate"] = "master-private";
    FileLocation["MasterPublic"] = "master-public";
    FileLocation["S3"] = "s3";
    FileLocation["GCS"] = "gcs";
    FileLocation["URL"] = "url";
    FileLocation["None"] = "none";
})(FileLocation = exports.FileLocation || (exports.FileLocation = {}));
exports.instanceOfLocalStorageConfig = (obj) => typeof obj.publicDir === "string" &&
    typeof obj.privateDir === "string" &&
    typeof obj.jobDir === "string" &&
    typeof obj.templateDir === "string";


/***/ }),

/***/ "../shared/src/job/job-base.ts":
/*!*************************************!*\
  !*** ../shared/src/job/job-base.ts ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const message_api_1 = __webpack_require__(/*! ../message-api */ "../shared/src/message-api/index.ts");
const interfaces_1 = __webpack_require__(/*! ../file-provider/interfaces */ "../shared/src/file-provider/interfaces.ts");
class JobProcessParams {
    constructor() {
        this.log = true;
        this.progressIncrement = true;
        this.makeResultsPublicRead = false;
    }
}
exports.JobProcessParams = JobProcessParams;
class JobWorkerProcessParams {
}
exports.JobWorkerProcessParams = JobWorkerProcessParams;
function blankJob(Base, type) {
    return class BlankJob extends Base {
        constructor() {
            super(...arguments);
            this.type = type;
            this.inputs = undefined;
            this.outputs = undefined;
        }
    };
}
exports.blankJob = blankJob;
class JSONSerialiserT {
    fromJSON(outputJson) {
        Object.assign(this, outputJson);
        return this;
    }
    toJSON() {
        return Object.assign({}, this);
    }
}
exports.JSONSerialiserT = JSONSerialiserT;
var JobStatus;
(function (JobStatus) {
    JobStatus["INACTIVE"] = "INACTIVE";
    JobStatus["STARTING"] = "STARTING";
    JobStatus["QUEUED"] = "QUEUED";
    JobStatus["RUNNING"] = "RUNNING";
    JobStatus["FINISHED"] = "FINISHED";
    JobStatus["ERROR"] = "ERROR";
})(JobStatus = exports.JobStatus || (exports.JobStatus = {}));
/**
 *This class is used to parse/create JSON version of JobBase
 *Note: all fields must be given a value so they can be filled (only top-level fields need to be filled, nested properties don't need values)
 *
 * @export
 * @class JobJSON
 */
class JobJSON {
    constructor() {
        this.name = "";
        this.type = "";
        this.status = JobStatus.INACTIVE;
        this.progress = 0;
        // TODO: Make this relative to JOB directory not job base directory -> that is make this just ./Input and ./Output
        // Input directory relative to the job base directory (i.e. "$JOBNAME/Input")
        this.inputDirectory = "";
        // Output directory relative to the job base directory (i.e. "$JOBNAME/Output")
        this.outputDirectory = "";
        this.inputs = {};
        this.outputs = {};
        this.boundingBox4326 = undefined;
        this.outputStorageMode = interfaces_1.FileLocation.MasterJob;
        this.processParams = new JobProcessParams();
        this.numberOfSubjobs = 0;
        this.user = "";
    }
}
exports.JobJSON = JobJSON;
class JobBase {
    constructor(name) {
        this.type = undefined;
        this.inputs = undefined;
        this.outputs = undefined;
        this.debugMode = false;
        this.debug = console.debug;
        this._logMessages = [];
        this.onLogMessageUpdate = new Set();
        this._status = JobStatus.INACTIVE;
        this.onStatusUpdate = new Set();
        /**
         *  Prorgess between 0-100
         *
         * @protected
         */
        this._progress = 0;
        this.onProgressUpdate = new Set();
        // Input directory relative to the job base directory (i.e. "$JOBNAME/Input")
        this.inputDirectory = "";
        // Output directory relative to the job base directory (i.e. "$JOBNAME/Output")
        this.outputDirectory = "";
        this.outputStorageMode = interfaces_1.FileLocation.MasterJob;
        this.processParams = new JobProcessParams();
        this._startTime = new Date();
        this._finishTime = new Date();
        this.numberOfSubjobs = 0;
        this._name = name;
        this.debugMode = true;
    }
    get name() {
        return this._name;
    }
    get logMessages() {
        return this._logMessages;
    }
    get startTime() {
        return this._startTime;
    }
    get finishTime() {
        return this._finishTime;
    }
    set status(status) {
        if (this._status !== status) {
            this._status = status;
            this.onStatusUpdate.forEach(update => update(this._status));
            if (this.debugMode) {
                this.debug(`Updated status: ${status}`);
            }
            this.addLogMessage({
                name: this.name,
                type: message_api_1.LogMessageType.info,
                output: `updated status to ${status}`,
            });
        }
    }
    get status() {
        return this._status;
    }
    set progress(progress) {
        if (this._progress !== progress) {
            const oldProgress = this._progress;
            this._progress = Math.min(100, Math.max(0, progress));
            this.onProgressUpdate.forEach(update => update(this._progress, this._progress - oldProgress));
            if (this.debugMode) {
                this.debug(`Updated progress: ${progress}`);
            }
            this.addLogMessage({
                name: this.name,
                type: message_api_1.LogMessageType.info,
                output: `updated progress to ${progress}`,
            });
        }
    }
    get progress() {
        return this._progress;
    }
    addLogMessage(logMessage) {
        if (typeof logMessage.date === "undefined") {
            logMessage.date = new Date();
        }
        this._logMessages.push(logMessage);
        this.onLogMessageUpdate.forEach(update => update(logMessage));
    }
    clearLogs() {
        this._logMessages = [];
    }
    fromJSON(jobJson, keys) {
        let keysToUpdate = Object.keys(jobJson);
        // If a keys array is provided -> only update corresponding properties
        if (Array.isArray(keys)) {
            keysToUpdate = keys;
        }
        keysToUpdate = keysToUpdate.filter(key => key !== "type" && key !== "name");
        keysToUpdate.forEach(key => {
            // If Job property has fromJSON() function -> use it to revive property
            if (typeof this[key] !== "undefined" &&
                this[key] !== null &&
                typeof this[key].fromJSON === "function") {
                this[key] = this[key].fromJSON(jobJson[key]);
            }
            else {
                this[key] = jobJson[key];
            }
        });
        this.addLogMessage({
            name: this.name,
            type: message_api_1.LogMessageType.info,
            output: `updated job from json`,
        });
        return this;
    }
    toJSON() {
        const returnObj = new JobJSON();
        Object.keys(returnObj).forEach((field) => {
            const value = this[field];
            if (typeof value !== "undefined" &&
                value !== null &&
                typeof value.toJSON === "function") {
                returnObj[field] = value.toJSON();
            }
            else {
                returnObj[field] = value;
            }
        });
        return returnObj;
    }
}
exports.JobBase = JobBase;


/***/ }),

/***/ "../shared/src/job/job-types.ts":
/*!**************************************!*\
  !*** ../shared/src/job/job-types.ts ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var JobType;
(function (JobType) {
    JobType["SPARK"] = "spark";
    JobType["SPARKWORKSPACE"] = "spark-workspace";
    JobType["EMV2"] = "emv2";
    JobType["TEST"] = "test";
    JobType["CLIMATE_SLR"] = "climate-slr";
    JobType["CLIMATE_TEMP"] = "climate-temp";
    JobType["CLIMATE_PROJ"] = "climate-projections";
    JobType["SEW"] = "sew";
    JobType["COGG"] = "cog";
    JobType["NSWFIRE"] = "nsw-fire";
    JobType["EES"] = "ees";
})(JobType = exports.JobType || (exports.JobType = {}));
class JobTypeDescription {
}
exports.JobTypeDescription = JobTypeDescription;
exports.jobTypeDescriptions = [
    // { type: JobType.SPARKWORKSPACE, label: "Spark (workspace)" },
    // { type: JobType.SPARK, label: "Spark (geostack)" },
    { type: JobType.EMV2, label: "Emergency Evacuation Simulation" },
];


/***/ }),

/***/ "../shared/src/job/job-types/emv2/inputs-outputs.ts":
/*!**********************************************************!*\
  !*** ../shared/src/job/job-types/emv2/inputs-outputs.ts ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const job_base_1 = __webpack_require__(/*! ../../job-base */ "../shared/src/job/job-base.ts");
const turf_1 = __webpack_require__(/*! @turf/turf */ "../node_modules/@turf/turf/turf.min.js");
const interfaces_1 = __webpack_require__(/*! ../../../file-provider/interfaces */ "../shared/src/file-provider/interfaces.ts");
class Emv2JobInputs extends job_base_1.JSONSerialiserT {
    constructor() {
        super(...arguments);
        this.inputProjection = "EPSG:4326";
        this.fireRasterSelectionGeometry = turf_1.featureCollection([]);
        this.fireRasterSelection = [];
        this.fireRasterFilter = [];
        this.fireRasterBaseDirectory = {};
        this.fireSummaryGeojson = {};
        this.outputGeojson = {
            name: "output.json",
            path: "Output/output.json",
            type: "file",
            location: interfaces_1.FileLocation.MasterJob,
        };
        this.networkConfig = {
            constant: 100.0,
            defaultLinkType: 3,
        };
        this.files = {};
    }
}
exports.Emv2JobInputs = Emv2JobInputs;
class Emv2JobOutputs extends job_base_1.JSONSerialiserT {
}
exports.Emv2JobOutputs = Emv2JobOutputs;
exports.emv2SubjobName = (name, fire) => `!${name} subjob ${fire}`;


/***/ }),

/***/ "../shared/src/message-api/index.ts":
/*!******************************************!*\
  !*** ../shared/src/message-api/index.ts ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(/*! ./message-api */ "../shared/src/message-api/message-api.ts"));
__export(__webpack_require__(/*! ./websocket-api */ "../shared/src/message-api/websocket-api.ts"));


/***/ }),

/***/ "../shared/src/message-api/message-api.ts":
/*!************************************************!*\
  !*** ../shared/src/message-api/message-api.ts ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var JobMessageTypes;
(function (JobMessageTypes) {
    JobMessageTypes["Data"] = "job-data";
    JobMessageTypes["PartialData"] = "job-partial-data";
    JobMessageTypes["Status"] = "job-status";
    JobMessageTypes["Get"] = "job-get";
    JobMessageTypes["New"] = "job-new";
    JobMessageTypes["Log"] = "job-log";
    JobMessageTypes["Run"] = "job-run";
    JobMessageTypes["Stop"] = "job-stop";
    JobMessageTypes["Delete"] = "job-delete";
})(JobMessageTypes = exports.JobMessageTypes || (exports.JobMessageTypes = {}));
var JobListMessageTypes;
(function (JobListMessageTypes) {
    JobListMessageTypes["Get"] = "job-list-get";
    JobListMessageTypes["GetTemplate"] = "job-list-get-templates";
})(JobListMessageTypes = exports.JobListMessageTypes || (exports.JobListMessageTypes = {}));
var ServerConfigMessageTypes;
(function (ServerConfigMessageTypes) {
    ServerConfigMessageTypes["Get"] = "server-config-get";
    ServerConfigMessageTypes["Data"] = "server-config-data";
})(ServerConfigMessageTypes = exports.ServerConfigMessageTypes || (exports.ServerConfigMessageTypes = {}));
// Start error message api interfaces
var FlashMessageTypes;
(function (FlashMessageTypes) {
    FlashMessageTypes["General"] = "flash-message-general";
})(FlashMessageTypes = exports.FlashMessageTypes || (exports.FlashMessageTypes = {}));
class MessageNew {
    constructor(type) {
        this._type = type;
    }
    get type() {
        return this._type;
    }
    toJSON() {
        // return all properties other than 'type'
        return {
            type: this.type,
            data: Object.keys(this)
                .filter(key => !["type", "_type"].includes(key))
                .reduce((obj, key) => {
                obj[key] = this[key];
                return obj;
            }, {}),
        };
    }
}
exports.MessageNew = MessageNew;
class FlashMessage extends MessageNew {
    constructor(obj) {
        super(FlashMessageTypes.General);
        this.title = "An error has occurred";
        this.severity = "error";
        this.duration = 6000;
        this.sticky = false;
        Object.assign(this, obj);
    }
}
exports.FlashMessage = FlashMessage;
class ServerConfigGetMessage extends MessageNew {
    constructor(obj = {}) {
        super(ServerConfigMessageTypes.Get);
        Object.assign(this, obj);
    }
}
exports.ServerConfigGetMessage = ServerConfigGetMessage;
class ServerConfigDataMessage extends MessageNew {
    constructor(obj) {
        super(ServerConfigMessageTypes.Data);
        Object.assign(this, obj);
    }
}
exports.ServerConfigDataMessage = ServerConfigDataMessage;
var LogMessageType;
(function (LogMessageType) {
    LogMessageType["info"] = "info";
    LogMessageType["workerInfo"] = "worker-info";
    LogMessageType["error"] = "error";
    LogMessageType["stdout"] = "stdout";
    LogMessageType["stderr"] = "stderr";
    LogMessageType["exitcode"] = "exitcode";
})(LogMessageType = exports.LogMessageType || (exports.LogMessageType = {}));
exports.IGetDirTreeSignedURLType = "get-dir-tree-signed-url";


/***/ }),

/***/ "../shared/src/message-api/websocket-api.ts":
/*!**************************************************!*\
  !*** ../shared/src/message-api/websocket-api.ts ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var WebSocketAuthMessageTypes;
(function (WebSocketAuthMessageTypes) {
    WebSocketAuthMessageTypes["AuthLogin"] = "auth-login";
    WebSocketAuthMessageTypes["AuthFailed"] = "auth-failed";
    WebSocketAuthMessageTypes["AuthInvalid"] = "auth-invalid";
    WebSocketAuthMessageTypes["AuthSuccess"] = "auth-success";
})(WebSocketAuthMessageTypes = exports.WebSocketAuthMessageTypes || (exports.WebSocketAuthMessageTypes = {}));


/***/ }),

/***/ "../shared/src/user/user.ts":
/*!**********************************!*\
  !*** ../shared/src/user/user.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class GeowebUser {
}
exports.GeowebUser = GeowebUser;
var GeowebUserRoles;
(function (GeowebUserRoles) {
    GeowebUserRoles["User"] = "user";
    GeowebUserRoles["Admin"] = "admin";
})(GeowebUserRoles = exports.GeowebUserRoles || (exports.GeowebUserRoles = {}));
class GeowebJWT extends GeowebUser {
}
exports.GeowebJWT = GeowebJWT;


/***/ }),

/***/ "../shared/src/util/array.ts":
/*!***********************************!*\
  !*** ../shared/src/util/array.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// From https://stackoverflow.com/questions/42623071/maximum-call-stack-size-exceeded-with-math-min-and-math-max
function getMax(arr) {
    let len = arr.length;
    let max = 0;
    while (len--) {
        max = arr[len] > max ? arr[len] : max;
    }
    return max;
}
exports.getMax = getMax;
function getAbsMax(arr, noDataValue = 0) {
    let len = arr.length;
    let max = 0;
    while (len--) {
        max =
            arr[len] > noDataValue && Math.abs(arr[len]) > max
                ? Math.abs(arr[len])
                : max;
    }
    return max;
}
exports.getAbsMax = getAbsMax;
// Adapted https://gist.github.com/miguelmota/5f27d5cdb8462fbbb402
function flattenArray(array) {
    return Array.isArray(array)
        ? [].concat.apply([], array.map(flattenArray))
        : array;
}
exports.flattenArray = flattenArray;
// Where did this come from?
function concatenate(resultConstructor, ...arrays) {
    let totalLength = 0;
    for (const arr of arrays) {
        totalLength += arr.length;
    }
    const result = new resultConstructor(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}
exports.concatenate = concatenate;


/***/ }),

/***/ "../shared/src/util/dates.ts":
/*!***********************************!*\
  !*** ../shared/src/util/dates.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
function dateToUtcDate(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()));
}
exports.dateToUtcDate = dateToUtcDate;
// Adapted from https://stackoverflow.com/a/37096512
function secondsToHMSString(d) {
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    const s = Math.floor((d % 3600) % 60);
    return `${h > 0 ? `${h}h ` : ""}
    ${m > 0 || h > 0 ? `${m.toString().padStart(2, "0")}m ` : ""}
    ${s.toString().padStart(2, "0")}s`;
}
exports.secondsToHMSString = secondsToHMSString;
function secondsToHMString(format = "hm") {
    return (d) => {
        const h = Math.floor(d / 3600) + Math.floor(Math.round((d % 3600) / 60) / 60);
        const m = Math.round((d % 3600) / 60) % 60;
        if (format === "hm") {
            return `${h > 0 ? `${h}h ` : ""}${m.toString().padStart(2, "0")}m`;
        }
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };
}
exports.secondsToHMString = secondsToHMString;


/***/ }),

/***/ "../shared/src/util/geospatial-projections.ts":
/*!****************************************************!*\
  !*** ../shared/src/util/geospatial-projections.ts ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const turf_1 = __webpack_require__(/*! @turf/turf */ "../node_modules/@turf/turf/turf.min.js");
const proj4x = __webpack_require__(/*! proj4 */ "../node_modules/proj4/lib/index.js");
let proj4;
// FIXME: this is annoying - probably something to do with angular-cli webpack stuff
if (typeof window === "undefined") {
    proj4 = proj4x;
}
else {
    proj4 = proj4x.default;
}
exports.proj4defs = [
    [
        "EPSG:32718",
        "+proj=utm +zone=18 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs ",
    ],
    [
        "EPSG:32767",
        "+proj=lcc +lat_1=-36 +lat_2=-38 +lat_0=-37 +lon_0=145 +x_0=2500000 +y_0=2500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ",
    ],
    [
        "EPSG:3111",
        "+proj=lcc +lat_1=-36 +lat_2=-38 +lat_0=-37 +lon_0=145 +x_0=2500000 +y_0=2500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ",
    ],
    [
        "EPSG:28355",
        "+proj=utm +zone=55 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs ",
    ],
    ["EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs"],
];
proj4.defs(exports.proj4defs);
exports.EPSG4326 = "EPSG:4326";
exports.EPSG3857 = "EPSG:3857";
function projectBBox(bbox, fromProjection = exports.EPSG3857, toProjection = exports.EPSG4326) {
    return [
        ...projectCoords([bbox[0], bbox[1]], fromProjection, toProjection),
        ...projectCoords([bbox[2], bbox[3]], fromProjection, toProjection),
    ];
}
exports.projectBBox = projectBBox;
function projectCoords(coords, fromProjection = exports.EPSG3857, toProjection = exports.EPSG4326) {
    return proj4(fromProjection, toProjection).forward(coords);
}
exports.projectCoords = projectCoords;
function projectFeatureCollection(fc, fromProjection = exports.EPSG3857, toProjection = exports.EPSG4326, inPlace = true) {
    let projectedFc;
    if (!inPlace) {
        projectedFc = turf_1.clone(fc);
    }
    else {
        projectedFc = fc;
    }
    projectedFc.features.forEach((f, fIdx) => {
        if (f.geometry.type === "LineString") {
            const lineStringFeature = f;
            lineStringFeature.geometry.coordinates.forEach((coords, cIdx) => {
                lineStringFeature.geometry.coordinates[cIdx] = projectCoords(coords, fromProjection, toProjection);
            });
        }
        else if (f.geometry.type === "Polygon") {
            const polygonFeature = f;
            // Project coordinates
            polygonFeature.geometry.coordinates.forEach((linearRings, lrIdx) => {
                linearRings.forEach((coords, cIdx) => {
                    polygonFeature.geometry.coordinates[lrIdx][cIdx] = projectCoords(coords, fromProjection, toProjection);
                });
            });
        }
        else if (f.geometry.type === "MultiPolygon") {
            const multiPolygonFeature = f;
            // Project coordinates
            multiPolygonFeature.geometry.coordinates.forEach((polygon, pIdx) => {
                polygon.forEach((linearRings, lrIdx) => {
                    linearRings.forEach((coords, cIdx) => {
                        multiPolygonFeature.geometry.coordinates[pIdx][lrIdx][cIdx] = projectCoords(coords, fromProjection, toProjection);
                    });
                });
            });
        }
        else if (f.geometry.type === "Point") {
            const pointFeature = f;
            // Project coordinates
            pointFeature.geometry.coordinates = projectCoords(pointFeature.geometry.coordinates, fromProjection, toProjection);
        }
    });
    // coordEach(projectedFc, coord => {
    //   coord = project(coord)
    // })
    // Project bounding box coords
    // ;[projectedFc.bbox[0], projectedFc.bbox[1]] = project([projectedFc.bbox[0], projectedFc.bbox[1]])
    // Why
    // ;[projectedFc.bbox[2], projectedFc.bbox[3]] = project([projectedFc.bbox[2], projectedFc.bbox[3]])
    return projectedFc;
}
exports.projectFeatureCollection = projectFeatureCollection;


/***/ }),

/***/ "../shared/src/util/string.ts":
/*!************************************!*\
  !*** ../shared/src/util/string.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function pad0s(number, zeros = 2) {
    return number.toString().padStart(zeros, "0");
}
exports.pad0s = pad0s;
function toFixedDrop0s(number, toFixed = 2) {
    return number.toFixed(toFixed).replace(/\.00$/, "");
}
exports.toFixedDrop0s = toFixedDrop0s;
// From https://stackoverflow.com/a/14428340
function formatCurrency(number) {
    const money = `$${number.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
    return money.length < 10 ? money : money.split(".")[0];
}
exports.formatCurrency = formatCurrency;
exports.alphaNumericDashesValidator = {
    isValid: (str) => str === "" || isValidForRegexpFn(/^[a-zA-Z0-9-_]+$/)(str),
    errorMessage: "Must only contain alphanumerics, dashes or underscores (a-Z, 0-9, -, _)",
};
exports.positiveIntegerValidator = {
    isValid: (str) => str === "" || isValidForRegexpFn(/^\+?(0|[1-9]\d*)$/)(str),
    errorMessage: "Positive integer value required",
};
// Adapted from https://stackoverflow.com/a/10834843
exports.integerValidator = {
    isValid: (str) => str === "" || isValidForRegexpFn(/^[-+]?(0|[1-9]\d*)$/)(str),
    errorMessage: "Integer value required",
};
// From http://regexlib.com/Search.aspx?k=float&AspxAutoDetectCookieSupport=1
exports.floatValidator = {
    isValid: isValidForRegexpFn(/^[-+]?\d*\.?\d*$/),
    errorMessage: "Number required",
};
exports.latitudeValidator = {
    isValid: str => exports.floatValidator.isValid(str) && isLatitude(parseFloat(str)),
    errorMessage: "Invalid latitude",
};
exports.longitudeValidator = {
    isValid: str => exports.floatValidator.isValid(str) && isLongitude(parseFloat(str)),
    errorMessage: "Invalid longitude",
};
function isLatitude(lat) {
    return isFinite(lat) && Math.abs(lat) <= 90;
}
exports.isLatitude = isLatitude;
function isLongitude(lng) {
    return isFinite(lng) && Math.abs(lng) <= 180;
}
exports.isLongitude = isLongitude;
function isValidForRegexpFn(regexp) {
    return (str) => str.toString().search(regexp) !== -1;
}
exports.isValidForRegexpFn = isValidForRegexpFn;
function isValidForRegexp(str, regexp) {
    return str.toString().search(regexp) !== -1;
}
exports.isValidForRegexp = isValidForRegexp;
// Adapted from https://stackoverflow.com/a/4253415
function escapeString(str) {
    return str
        .replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");
}
exports.escapeString = escapeString;
function parseCsv(str) {
    return str
        .replace(/[\r]+/g, "")
        .split("\n")
        .map(row => (row !== "" ? row.split(",") : undefined))
        .filter(row => row !== undefined);
}
exports.parseCsv = parseCsv;


/***/ }),

/***/ "./node_modules/core-js/es7/reflect.js":
/*!*********************************************!*\
  !*** ./node_modules/core-js/es7/reflect.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(/*! ../modules/es7.reflect.define-metadata */ "./node_modules/core-js/modules/es7.reflect.define-metadata.js");
__webpack_require__(/*! ../modules/es7.reflect.delete-metadata */ "./node_modules/core-js/modules/es7.reflect.delete-metadata.js");
__webpack_require__(/*! ../modules/es7.reflect.get-metadata */ "./node_modules/core-js/modules/es7.reflect.get-metadata.js");
__webpack_require__(/*! ../modules/es7.reflect.get-metadata-keys */ "./node_modules/core-js/modules/es7.reflect.get-metadata-keys.js");
__webpack_require__(/*! ../modules/es7.reflect.get-own-metadata */ "./node_modules/core-js/modules/es7.reflect.get-own-metadata.js");
__webpack_require__(/*! ../modules/es7.reflect.get-own-metadata-keys */ "./node_modules/core-js/modules/es7.reflect.get-own-metadata-keys.js");
__webpack_require__(/*! ../modules/es7.reflect.has-metadata */ "./node_modules/core-js/modules/es7.reflect.has-metadata.js");
__webpack_require__(/*! ../modules/es7.reflect.has-own-metadata */ "./node_modules/core-js/modules/es7.reflect.has-own-metadata.js");
__webpack_require__(/*! ../modules/es7.reflect.metadata */ "./node_modules/core-js/modules/es7.reflect.metadata.js");
module.exports = __webpack_require__(/*! ../modules/_core */ "./node_modules/core-js/modules/_core.js").Reflect;


/***/ }),

/***/ "./node_modules/core-js/modules/_a-function.js":
/*!*****************************************************!*\
  !*** ./node_modules/core-js/modules/_a-function.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_an-instance.js":
/*!******************************************************!*\
  !*** ./node_modules/core-js/modules/_an-instance.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function (it, Constructor, name, forbiddenField) {
  if (!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)) {
    throw TypeError(name + ': incorrect invocation!');
  } return it;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_an-object.js":
/*!****************************************************!*\
  !*** ./node_modules/core-js/modules/_an-object.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(/*! ./_is-object */ "./node_modules/core-js/modules/_is-object.js");
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_array-from-iterable.js":
/*!**************************************************************!*\
  !*** ./node_modules/core-js/modules/_array-from-iterable.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var forOf = __webpack_require__(/*! ./_for-of */ "./node_modules/core-js/modules/_for-of.js");

module.exports = function (iter, ITERATOR) {
  var result = [];
  forOf(iter, false, result.push, result, ITERATOR);
  return result;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_array-includes.js":
/*!*********************************************************!*\
  !*** ./node_modules/core-js/modules/_array-includes.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// false -> Array#indexOf
// true  -> Array#includes
var toIObject = __webpack_require__(/*! ./_to-iobject */ "./node_modules/core-js/modules/_to-iobject.js");
var toLength = __webpack_require__(/*! ./_to-length */ "./node_modules/core-js/modules/_to-length.js");
var toAbsoluteIndex = __webpack_require__(/*! ./_to-absolute-index */ "./node_modules/core-js/modules/_to-absolute-index.js");
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};


/***/ }),

/***/ "./node_modules/core-js/modules/_array-methods.js":
/*!********************************************************!*\
  !*** ./node_modules/core-js/modules/_array-methods.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx = __webpack_require__(/*! ./_ctx */ "./node_modules/core-js/modules/_ctx.js");
var IObject = __webpack_require__(/*! ./_iobject */ "./node_modules/core-js/modules/_iobject.js");
var toObject = __webpack_require__(/*! ./_to-object */ "./node_modules/core-js/modules/_to-object.js");
var toLength = __webpack_require__(/*! ./_to-length */ "./node_modules/core-js/modules/_to-length.js");
var asc = __webpack_require__(/*! ./_array-species-create */ "./node_modules/core-js/modules/_array-species-create.js");
module.exports = function (TYPE, $create) {
  var IS_MAP = TYPE == 1;
  var IS_FILTER = TYPE == 2;
  var IS_SOME = TYPE == 3;
  var IS_EVERY = TYPE == 4;
  var IS_FIND_INDEX = TYPE == 6;
  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
  var create = $create || asc;
  return function ($this, callbackfn, that) {
    var O = toObject($this);
    var self = IObject(O);
    var f = ctx(callbackfn, that, 3);
    var length = toLength(self.length);
    var index = 0;
    var result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
    var val, res;
    for (;length > index; index++) if (NO_HOLES || index in self) {
      val = self[index];
      res = f(val, index, O);
      if (TYPE) {
        if (IS_MAP) result[index] = res;   // map
        else if (res) switch (TYPE) {
          case 3: return true;             // some
          case 5: return val;              // find
          case 6: return index;            // findIndex
          case 2: result.push(val);        // filter
        } else if (IS_EVERY) return false; // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
  };
};


/***/ }),

/***/ "./node_modules/core-js/modules/_array-species-constructor.js":
/*!********************************************************************!*\
  !*** ./node_modules/core-js/modules/_array-species-constructor.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(/*! ./_is-object */ "./node_modules/core-js/modules/_is-object.js");
var isArray = __webpack_require__(/*! ./_is-array */ "./node_modules/core-js/modules/_is-array.js");
var SPECIES = __webpack_require__(/*! ./_wks */ "./node_modules/core-js/modules/_wks.js")('species');

module.exports = function (original) {
  var C;
  if (isArray(original)) {
    C = original.constructor;
    // cross-realm fallback
    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
    if (isObject(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  } return C === undefined ? Array : C;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_array-species-create.js":
/*!***************************************************************!*\
  !*** ./node_modules/core-js/modules/_array-species-create.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var speciesConstructor = __webpack_require__(/*! ./_array-species-constructor */ "./node_modules/core-js/modules/_array-species-constructor.js");

module.exports = function (original, length) {
  return new (speciesConstructor(original))(length);
};


/***/ }),

/***/ "./node_modules/core-js/modules/_classof.js":
/*!**************************************************!*\
  !*** ./node_modules/core-js/modules/_classof.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = __webpack_require__(/*! ./_cof */ "./node_modules/core-js/modules/_cof.js");
var TAG = __webpack_require__(/*! ./_wks */ "./node_modules/core-js/modules/_wks.js")('toStringTag');
// ES3 wrong here
var ARG = cof(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (e) { /* empty */ }
};

module.exports = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_cof.js":
/*!**********************************************!*\
  !*** ./node_modules/core-js/modules/_cof.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};


/***/ }),

/***/ "./node_modules/core-js/modules/_collection-strong.js":
/*!************************************************************!*\
  !*** ./node_modules/core-js/modules/_collection-strong.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var dP = __webpack_require__(/*! ./_object-dp */ "./node_modules/core-js/modules/_object-dp.js").f;
var create = __webpack_require__(/*! ./_object-create */ "./node_modules/core-js/modules/_object-create.js");
var redefineAll = __webpack_require__(/*! ./_redefine-all */ "./node_modules/core-js/modules/_redefine-all.js");
var ctx = __webpack_require__(/*! ./_ctx */ "./node_modules/core-js/modules/_ctx.js");
var anInstance = __webpack_require__(/*! ./_an-instance */ "./node_modules/core-js/modules/_an-instance.js");
var forOf = __webpack_require__(/*! ./_for-of */ "./node_modules/core-js/modules/_for-of.js");
var $iterDefine = __webpack_require__(/*! ./_iter-define */ "./node_modules/core-js/modules/_iter-define.js");
var step = __webpack_require__(/*! ./_iter-step */ "./node_modules/core-js/modules/_iter-step.js");
var setSpecies = __webpack_require__(/*! ./_set-species */ "./node_modules/core-js/modules/_set-species.js");
var DESCRIPTORS = __webpack_require__(/*! ./_descriptors */ "./node_modules/core-js/modules/_descriptors.js");
var fastKey = __webpack_require__(/*! ./_meta */ "./node_modules/core-js/modules/_meta.js").fastKey;
var validate = __webpack_require__(/*! ./_validate-collection */ "./node_modules/core-js/modules/_validate-collection.js");
var SIZE = DESCRIPTORS ? '_s' : 'size';

var getEntry = function (that, key) {
  // fast case
  var index = fastKey(key);
  var entry;
  if (index !== 'F') return that._i[index];
  // frozen object case
  for (entry = that._f; entry; entry = entry.n) {
    if (entry.k == key) return entry;
  }
};

module.exports = {
  getConstructor: function (wrapper, NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance(that, C, NAME, '_i');
      that._t = NAME;         // collection type
      that._i = create(null); // index
      that._f = undefined;    // first entry
      that._l = undefined;    // last entry
      that[SIZE] = 0;         // size
      if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear() {
        for (var that = validate(this, NAME), data = that._i, entry = that._f; entry; entry = entry.n) {
          entry.r = true;
          if (entry.p) entry.p = entry.p.n = undefined;
          delete data[entry.i];
        }
        that._f = that._l = undefined;
        that[SIZE] = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function (key) {
        var that = validate(this, NAME);
        var entry = getEntry(that, key);
        if (entry) {
          var next = entry.n;
          var prev = entry.p;
          delete that._i[entry.i];
          entry.r = true;
          if (prev) prev.n = next;
          if (next) next.p = prev;
          if (that._f == entry) that._f = next;
          if (that._l == entry) that._l = prev;
          that[SIZE]--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /* , that = undefined */) {
        validate(this, NAME);
        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3);
        var entry;
        while (entry = entry ? entry.n : this._f) {
          f(entry.v, entry.k, this);
          // revert to the last existing entry
          while (entry && entry.r) entry = entry.p;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key) {
        return !!getEntry(validate(this, NAME), key);
      }
    });
    if (DESCRIPTORS) dP(C.prototype, 'size', {
      get: function () {
        return validate(this, NAME)[SIZE];
      }
    });
    return C;
  },
  def: function (that, key, value) {
    var entry = getEntry(that, key);
    var prev, index;
    // change existing entry
    if (entry) {
      entry.v = value;
    // create new entry
    } else {
      that._l = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that._l,             // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if (!that._f) that._f = entry;
      if (prev) prev.n = entry;
      that[SIZE]++;
      // add to index
      if (index !== 'F') that._i[index] = entry;
    } return that;
  },
  getEntry: getEntry,
  setStrong: function (C, NAME, IS_MAP) {
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    $iterDefine(C, NAME, function (iterated, kind) {
      this._t = validate(iterated, NAME); // target
      this._k = kind;                     // kind
      this._l = undefined;                // previous
    }, function () {
      var that = this;
      var kind = that._k;
      var entry = that._l;
      // revert to the last existing entry
      while (entry && entry.r) entry = entry.p;
      // get next entry
      if (!that._t || !(that._l = entry = entry ? entry.n : that._t._f)) {
        // or finish the iteration
        that._t = undefined;
        return step(1);
      }
      // return step by kind
      if (kind == 'keys') return step(0, entry.k);
      if (kind == 'values') return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies(NAME);
  }
};


/***/ }),

/***/ "./node_modules/core-js/modules/_collection-weak.js":
/*!**********************************************************!*\
  !*** ./node_modules/core-js/modules/_collection-weak.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var redefineAll = __webpack_require__(/*! ./_redefine-all */ "./node_modules/core-js/modules/_redefine-all.js");
var getWeak = __webpack_require__(/*! ./_meta */ "./node_modules/core-js/modules/_meta.js").getWeak;
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var isObject = __webpack_require__(/*! ./_is-object */ "./node_modules/core-js/modules/_is-object.js");
var anInstance = __webpack_require__(/*! ./_an-instance */ "./node_modules/core-js/modules/_an-instance.js");
var forOf = __webpack_require__(/*! ./_for-of */ "./node_modules/core-js/modules/_for-of.js");
var createArrayMethod = __webpack_require__(/*! ./_array-methods */ "./node_modules/core-js/modules/_array-methods.js");
var $has = __webpack_require__(/*! ./_has */ "./node_modules/core-js/modules/_has.js");
var validate = __webpack_require__(/*! ./_validate-collection */ "./node_modules/core-js/modules/_validate-collection.js");
var arrayFind = createArrayMethod(5);
var arrayFindIndex = createArrayMethod(6);
var id = 0;

// fallback for uncaught frozen keys
var uncaughtFrozenStore = function (that) {
  return that._l || (that._l = new UncaughtFrozenStore());
};
var UncaughtFrozenStore = function () {
  this.a = [];
};
var findUncaughtFrozen = function (store, key) {
  return arrayFind(store.a, function (it) {
    return it[0] === key;
  });
};
UncaughtFrozenStore.prototype = {
  get: function (key) {
    var entry = findUncaughtFrozen(this, key);
    if (entry) return entry[1];
  },
  has: function (key) {
    return !!findUncaughtFrozen(this, key);
  },
  set: function (key, value) {
    var entry = findUncaughtFrozen(this, key);
    if (entry) entry[1] = value;
    else this.a.push([key, value]);
  },
  'delete': function (key) {
    var index = arrayFindIndex(this.a, function (it) {
      return it[0] === key;
    });
    if (~index) this.a.splice(index, 1);
    return !!~index;
  }
};

module.exports = {
  getConstructor: function (wrapper, NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance(that, C, NAME, '_i');
      that._t = NAME;      // collection type
      that._i = id++;      // collection id
      that._l = undefined; // leak store for uncaught frozen objects
      if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.3.3.2 WeakMap.prototype.delete(key)
      // 23.4.3.3 WeakSet.prototype.delete(value)
      'delete': function (key) {
        if (!isObject(key)) return false;
        var data = getWeak(key);
        if (data === true) return uncaughtFrozenStore(validate(this, NAME))['delete'](key);
        return data && $has(data, this._i) && delete data[this._i];
      },
      // 23.3.3.4 WeakMap.prototype.has(key)
      // 23.4.3.4 WeakSet.prototype.has(value)
      has: function has(key) {
        if (!isObject(key)) return false;
        var data = getWeak(key);
        if (data === true) return uncaughtFrozenStore(validate(this, NAME)).has(key);
        return data && $has(data, this._i);
      }
    });
    return C;
  },
  def: function (that, key, value) {
    var data = getWeak(anObject(key), true);
    if (data === true) uncaughtFrozenStore(that).set(key, value);
    else data[that._i] = value;
    return that;
  },
  ufstore: uncaughtFrozenStore
};


/***/ }),

/***/ "./node_modules/core-js/modules/_collection.js":
/*!*****************************************************!*\
  !*** ./node_modules/core-js/modules/_collection.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(/*! ./_global */ "./node_modules/core-js/modules/_global.js");
var $export = __webpack_require__(/*! ./_export */ "./node_modules/core-js/modules/_export.js");
var redefine = __webpack_require__(/*! ./_redefine */ "./node_modules/core-js/modules/_redefine.js");
var redefineAll = __webpack_require__(/*! ./_redefine-all */ "./node_modules/core-js/modules/_redefine-all.js");
var meta = __webpack_require__(/*! ./_meta */ "./node_modules/core-js/modules/_meta.js");
var forOf = __webpack_require__(/*! ./_for-of */ "./node_modules/core-js/modules/_for-of.js");
var anInstance = __webpack_require__(/*! ./_an-instance */ "./node_modules/core-js/modules/_an-instance.js");
var isObject = __webpack_require__(/*! ./_is-object */ "./node_modules/core-js/modules/_is-object.js");
var fails = __webpack_require__(/*! ./_fails */ "./node_modules/core-js/modules/_fails.js");
var $iterDetect = __webpack_require__(/*! ./_iter-detect */ "./node_modules/core-js/modules/_iter-detect.js");
var setToStringTag = __webpack_require__(/*! ./_set-to-string-tag */ "./node_modules/core-js/modules/_set-to-string-tag.js");
var inheritIfRequired = __webpack_require__(/*! ./_inherit-if-required */ "./node_modules/core-js/modules/_inherit-if-required.js");

module.exports = function (NAME, wrapper, methods, common, IS_MAP, IS_WEAK) {
  var Base = global[NAME];
  var C = Base;
  var ADDER = IS_MAP ? 'set' : 'add';
  var proto = C && C.prototype;
  var O = {};
  var fixMethod = function (KEY) {
    var fn = proto[KEY];
    redefine(proto, KEY,
      KEY == 'delete' ? function (a) {
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'has' ? function has(a) {
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'get' ? function get(a) {
        return IS_WEAK && !isObject(a) ? undefined : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'add' ? function add(a) { fn.call(this, a === 0 ? 0 : a); return this; }
        : function set(a, b) { fn.call(this, a === 0 ? 0 : a, b); return this; }
    );
  };
  if (typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function () {
    new C().entries().next();
  }))) {
    // create collection constructor
    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
    redefineAll(C.prototype, methods);
    meta.NEED = true;
  } else {
    var instance = new C();
    // early implementations not supports chaining
    var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance;
    // V8 ~  Chromium 40- weak-collections throws on primitives, but should return false
    var THROWS_ON_PRIMITIVES = fails(function () { instance.has(1); });
    // most early implementations doesn't supports iterables, most modern - not close it correctly
    var ACCEPT_ITERABLES = $iterDetect(function (iter) { new C(iter); }); // eslint-disable-line no-new
    // for early implementations -0 and +0 not the same
    var BUGGY_ZERO = !IS_WEAK && fails(function () {
      // V8 ~ Chromium 42- fails only with 5+ elements
      var $instance = new C();
      var index = 5;
      while (index--) $instance[ADDER](index, index);
      return !$instance.has(-0);
    });
    if (!ACCEPT_ITERABLES) {
      C = wrapper(function (target, iterable) {
        anInstance(target, C, NAME);
        var that = inheritIfRequired(new Base(), target, C);
        if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
        return that;
      });
      C.prototype = proto;
      proto.constructor = C;
    }
    if (THROWS_ON_PRIMITIVES || BUGGY_ZERO) {
      fixMethod('delete');
      fixMethod('has');
      IS_MAP && fixMethod('get');
    }
    if (BUGGY_ZERO || HASNT_CHAINING) fixMethod(ADDER);
    // weak collections should not contains .clear method
    if (IS_WEAK && proto.clear) delete proto.clear;
  }

  setToStringTag(C, NAME);

  O[NAME] = C;
  $export($export.G + $export.W + $export.F * (C != Base), O);

  if (!IS_WEAK) common.setStrong(C, NAME, IS_MAP);

  return C;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_core.js":
/*!***********************************************!*\
  !*** ./node_modules/core-js/modules/_core.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var core = module.exports = { version: '2.6.10' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef


/***/ }),

/***/ "./node_modules/core-js/modules/_ctx.js":
/*!**********************************************!*\
  !*** ./node_modules/core-js/modules/_ctx.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// optional / simple context binding
var aFunction = __webpack_require__(/*! ./_a-function */ "./node_modules/core-js/modules/_a-function.js");
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};


/***/ }),

/***/ "./node_modules/core-js/modules/_defined.js":
/*!**************************************************!*\
  !*** ./node_modules/core-js/modules/_defined.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_descriptors.js":
/*!******************************************************!*\
  !*** ./node_modules/core-js/modules/_descriptors.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Thank's IE8 for his funny defineProperty
module.exports = !__webpack_require__(/*! ./_fails */ "./node_modules/core-js/modules/_fails.js")(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});


/***/ }),

/***/ "./node_modules/core-js/modules/_dom-create.js":
/*!*****************************************************!*\
  !*** ./node_modules/core-js/modules/_dom-create.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(/*! ./_is-object */ "./node_modules/core-js/modules/_is-object.js");
var document = __webpack_require__(/*! ./_global */ "./node_modules/core-js/modules/_global.js").document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};


/***/ }),

/***/ "./node_modules/core-js/modules/_enum-bug-keys.js":
/*!********************************************************!*\
  !*** ./node_modules/core-js/modules/_enum-bug-keys.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');


/***/ }),

/***/ "./node_modules/core-js/modules/_export.js":
/*!*************************************************!*\
  !*** ./node_modules/core-js/modules/_export.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(/*! ./_global */ "./node_modules/core-js/modules/_global.js");
var core = __webpack_require__(/*! ./_core */ "./node_modules/core-js/modules/_core.js");
var hide = __webpack_require__(/*! ./_hide */ "./node_modules/core-js/modules/_hide.js");
var redefine = __webpack_require__(/*! ./_redefine */ "./node_modules/core-js/modules/_redefine.js");
var ctx = __webpack_require__(/*! ./_ctx */ "./node_modules/core-js/modules/_ctx.js");
var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE];
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
  var key, own, out, exp;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if (target) redefine(target, key, out, type & $export.U);
    // export
    if (exports[key] != out) hide(exports, key, exp);
    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;


/***/ }),

/***/ "./node_modules/core-js/modules/_fails.js":
/*!************************************************!*\
  !*** ./node_modules/core-js/modules/_fails.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};


/***/ }),

/***/ "./node_modules/core-js/modules/_for-of.js":
/*!*************************************************!*\
  !*** ./node_modules/core-js/modules/_for-of.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var ctx = __webpack_require__(/*! ./_ctx */ "./node_modules/core-js/modules/_ctx.js");
var call = __webpack_require__(/*! ./_iter-call */ "./node_modules/core-js/modules/_iter-call.js");
var isArrayIter = __webpack_require__(/*! ./_is-array-iter */ "./node_modules/core-js/modules/_is-array-iter.js");
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var toLength = __webpack_require__(/*! ./_to-length */ "./node_modules/core-js/modules/_to-length.js");
var getIterFn = __webpack_require__(/*! ./core.get-iterator-method */ "./node_modules/core-js/modules/core.get-iterator-method.js");
var BREAK = {};
var RETURN = {};
var exports = module.exports = function (iterable, entries, fn, that, ITERATOR) {
  var iterFn = ITERATOR ? function () { return iterable; } : getIterFn(iterable);
  var f = ctx(fn, that, entries ? 2 : 1);
  var index = 0;
  var length, step, iterator, result;
  if (typeof iterFn != 'function') throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if (isArrayIter(iterFn)) for (length = toLength(iterable.length); length > index; index++) {
    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
    if (result === BREAK || result === RETURN) return result;
  } else for (iterator = iterFn.call(iterable); !(step = iterator.next()).done;) {
    result = call(iterator, f, step.value, entries);
    if (result === BREAK || result === RETURN) return result;
  }
};
exports.BREAK = BREAK;
exports.RETURN = RETURN;


/***/ }),

/***/ "./node_modules/core-js/modules/_function-to-string.js":
/*!*************************************************************!*\
  !*** ./node_modules/core-js/modules/_function-to-string.js ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! ./_shared */ "./node_modules/core-js/modules/_shared.js")('native-function-to-string', Function.toString);


/***/ }),

/***/ "./node_modules/core-js/modules/_global.js":
/*!*************************************************!*\
  !*** ./node_modules/core-js/modules/_global.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef


/***/ }),

/***/ "./node_modules/core-js/modules/_has.js":
/*!**********************************************!*\
  !*** ./node_modules/core-js/modules/_has.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};


/***/ }),

/***/ "./node_modules/core-js/modules/_hide.js":
/*!***********************************************!*\
  !*** ./node_modules/core-js/modules/_hide.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var dP = __webpack_require__(/*! ./_object-dp */ "./node_modules/core-js/modules/_object-dp.js");
var createDesc = __webpack_require__(/*! ./_property-desc */ "./node_modules/core-js/modules/_property-desc.js");
module.exports = __webpack_require__(/*! ./_descriptors */ "./node_modules/core-js/modules/_descriptors.js") ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_html.js":
/*!***********************************************!*\
  !*** ./node_modules/core-js/modules/_html.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var document = __webpack_require__(/*! ./_global */ "./node_modules/core-js/modules/_global.js").document;
module.exports = document && document.documentElement;


/***/ }),

/***/ "./node_modules/core-js/modules/_ie8-dom-define.js":
/*!*********************************************************!*\
  !*** ./node_modules/core-js/modules/_ie8-dom-define.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = !__webpack_require__(/*! ./_descriptors */ "./node_modules/core-js/modules/_descriptors.js") && !__webpack_require__(/*! ./_fails */ "./node_modules/core-js/modules/_fails.js")(function () {
  return Object.defineProperty(__webpack_require__(/*! ./_dom-create */ "./node_modules/core-js/modules/_dom-create.js")('div'), 'a', { get: function () { return 7; } }).a != 7;
});


/***/ }),

/***/ "./node_modules/core-js/modules/_inherit-if-required.js":
/*!**************************************************************!*\
  !*** ./node_modules/core-js/modules/_inherit-if-required.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(/*! ./_is-object */ "./node_modules/core-js/modules/_is-object.js");
var setPrototypeOf = __webpack_require__(/*! ./_set-proto */ "./node_modules/core-js/modules/_set-proto.js").set;
module.exports = function (that, target, C) {
  var S = target.constructor;
  var P;
  if (S !== C && typeof S == 'function' && (P = S.prototype) !== C.prototype && isObject(P) && setPrototypeOf) {
    setPrototypeOf(that, P);
  } return that;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_iobject.js":
/*!**************************************************!*\
  !*** ./node_modules/core-js/modules/_iobject.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = __webpack_require__(/*! ./_cof */ "./node_modules/core-js/modules/_cof.js");
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};


/***/ }),

/***/ "./node_modules/core-js/modules/_is-array-iter.js":
/*!********************************************************!*\
  !*** ./node_modules/core-js/modules/_is-array-iter.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// check on default Array iterator
var Iterators = __webpack_require__(/*! ./_iterators */ "./node_modules/core-js/modules/_iterators.js");
var ITERATOR = __webpack_require__(/*! ./_wks */ "./node_modules/core-js/modules/_wks.js")('iterator');
var ArrayProto = Array.prototype;

module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};


/***/ }),

/***/ "./node_modules/core-js/modules/_is-array.js":
/*!***************************************************!*\
  !*** ./node_modules/core-js/modules/_is-array.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// 7.2.2 IsArray(argument)
var cof = __webpack_require__(/*! ./_cof */ "./node_modules/core-js/modules/_cof.js");
module.exports = Array.isArray || function isArray(arg) {
  return cof(arg) == 'Array';
};


/***/ }),

/***/ "./node_modules/core-js/modules/_is-object.js":
/*!****************************************************!*\
  !*** ./node_modules/core-js/modules/_is-object.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};


/***/ }),

/***/ "./node_modules/core-js/modules/_iter-call.js":
/*!****************************************************!*\
  !*** ./node_modules/core-js/modules/_iter-call.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// call something on iterator step with safe closing on error
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
module.exports = function (iterator, fn, value, entries) {
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (e) {
    var ret = iterator['return'];
    if (ret !== undefined) anObject(ret.call(iterator));
    throw e;
  }
};


/***/ }),

/***/ "./node_modules/core-js/modules/_iter-create.js":
/*!******************************************************!*\
  !*** ./node_modules/core-js/modules/_iter-create.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var create = __webpack_require__(/*! ./_object-create */ "./node_modules/core-js/modules/_object-create.js");
var descriptor = __webpack_require__(/*! ./_property-desc */ "./node_modules/core-js/modules/_property-desc.js");
var setToStringTag = __webpack_require__(/*! ./_set-to-string-tag */ "./node_modules/core-js/modules/_set-to-string-tag.js");
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
__webpack_require__(/*! ./_hide */ "./node_modules/core-js/modules/_hide.js")(IteratorPrototype, __webpack_require__(/*! ./_wks */ "./node_modules/core-js/modules/_wks.js")('iterator'), function () { return this; });

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};


/***/ }),

/***/ "./node_modules/core-js/modules/_iter-define.js":
/*!******************************************************!*\
  !*** ./node_modules/core-js/modules/_iter-define.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var LIBRARY = __webpack_require__(/*! ./_library */ "./node_modules/core-js/modules/_library.js");
var $export = __webpack_require__(/*! ./_export */ "./node_modules/core-js/modules/_export.js");
var redefine = __webpack_require__(/*! ./_redefine */ "./node_modules/core-js/modules/_redefine.js");
var hide = __webpack_require__(/*! ./_hide */ "./node_modules/core-js/modules/_hide.js");
var Iterators = __webpack_require__(/*! ./_iterators */ "./node_modules/core-js/modules/_iterators.js");
var $iterCreate = __webpack_require__(/*! ./_iter-create */ "./node_modules/core-js/modules/_iter-create.js");
var setToStringTag = __webpack_require__(/*! ./_set-to-string-tag */ "./node_modules/core-js/modules/_set-to-string-tag.js");
var getPrototypeOf = __webpack_require__(/*! ./_object-gpo */ "./node_modules/core-js/modules/_object-gpo.js");
var ITERATOR = __webpack_require__(/*! ./_wks */ "./node_modules/core-js/modules/_wks.js")('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  $iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!LIBRARY && typeof IteratorPrototype[ITERATOR] != 'function') hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_iter-detect.js":
/*!******************************************************!*\
  !*** ./node_modules/core-js/modules/_iter-detect.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var ITERATOR = __webpack_require__(/*! ./_wks */ "./node_modules/core-js/modules/_wks.js")('iterator');
var SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function () { SAFE_CLOSING = true; };
  // eslint-disable-next-line no-throw-literal
  Array.from(riter, function () { throw 2; });
} catch (e) { /* empty */ }

module.exports = function (exec, skipClosing) {
  if (!skipClosing && !SAFE_CLOSING) return false;
  var safe = false;
  try {
    var arr = [7];
    var iter = arr[ITERATOR]();
    iter.next = function () { return { done: safe = true }; };
    arr[ITERATOR] = function () { return iter; };
    exec(arr);
  } catch (e) { /* empty */ }
  return safe;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_iter-step.js":
/*!****************************************************!*\
  !*** ./node_modules/core-js/modules/_iter-step.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function (done, value) {
  return { value: value, done: !!done };
};


/***/ }),

/***/ "./node_modules/core-js/modules/_iterators.js":
/*!****************************************************!*\
  !*** ./node_modules/core-js/modules/_iterators.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = {};


/***/ }),

/***/ "./node_modules/core-js/modules/_library.js":
/*!**************************************************!*\
  !*** ./node_modules/core-js/modules/_library.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = false;


/***/ }),

/***/ "./node_modules/core-js/modules/_meta.js":
/*!***********************************************!*\
  !*** ./node_modules/core-js/modules/_meta.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var META = __webpack_require__(/*! ./_uid */ "./node_modules/core-js/modules/_uid.js")('meta');
var isObject = __webpack_require__(/*! ./_is-object */ "./node_modules/core-js/modules/_is-object.js");
var has = __webpack_require__(/*! ./_has */ "./node_modules/core-js/modules/_has.js");
var setDesc = __webpack_require__(/*! ./_object-dp */ "./node_modules/core-js/modules/_object-dp.js").f;
var id = 0;
var isExtensible = Object.isExtensible || function () {
  return true;
};
var FREEZE = !__webpack_require__(/*! ./_fails */ "./node_modules/core-js/modules/_fails.js")(function () {
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function (it) {
  setDesc(it, META, { value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  } });
};
var fastKey = function (it, create) {
  // return primitive with prefix
  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function (it, create) {
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (FREEZE && meta.NEED && isExtensible(it) && !has(it, META)) setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY: META,
  NEED: false,
  fastKey: fastKey,
  getWeak: getWeak,
  onFreeze: onFreeze
};


/***/ }),

/***/ "./node_modules/core-js/modules/_metadata.js":
/*!***************************************************!*\
  !*** ./node_modules/core-js/modules/_metadata.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Map = __webpack_require__(/*! ./es6.map */ "./node_modules/core-js/modules/es6.map.js");
var $export = __webpack_require__(/*! ./_export */ "./node_modules/core-js/modules/_export.js");
var shared = __webpack_require__(/*! ./_shared */ "./node_modules/core-js/modules/_shared.js")('metadata');
var store = shared.store || (shared.store = new (__webpack_require__(/*! ./es6.weak-map */ "./node_modules/core-js/modules/es6.weak-map.js"))());

var getOrCreateMetadataMap = function (target, targetKey, create) {
  var targetMetadata = store.get(target);
  if (!targetMetadata) {
    if (!create) return undefined;
    store.set(target, targetMetadata = new Map());
  }
  var keyMetadata = targetMetadata.get(targetKey);
  if (!keyMetadata) {
    if (!create) return undefined;
    targetMetadata.set(targetKey, keyMetadata = new Map());
  } return keyMetadata;
};
var ordinaryHasOwnMetadata = function (MetadataKey, O, P) {
  var metadataMap = getOrCreateMetadataMap(O, P, false);
  return metadataMap === undefined ? false : metadataMap.has(MetadataKey);
};
var ordinaryGetOwnMetadata = function (MetadataKey, O, P) {
  var metadataMap = getOrCreateMetadataMap(O, P, false);
  return metadataMap === undefined ? undefined : metadataMap.get(MetadataKey);
};
var ordinaryDefineOwnMetadata = function (MetadataKey, MetadataValue, O, P) {
  getOrCreateMetadataMap(O, P, true).set(MetadataKey, MetadataValue);
};
var ordinaryOwnMetadataKeys = function (target, targetKey) {
  var metadataMap = getOrCreateMetadataMap(target, targetKey, false);
  var keys = [];
  if (metadataMap) metadataMap.forEach(function (_, key) { keys.push(key); });
  return keys;
};
var toMetaKey = function (it) {
  return it === undefined || typeof it == 'symbol' ? it : String(it);
};
var exp = function (O) {
  $export($export.S, 'Reflect', O);
};

module.exports = {
  store: store,
  map: getOrCreateMetadataMap,
  has: ordinaryHasOwnMetadata,
  get: ordinaryGetOwnMetadata,
  set: ordinaryDefineOwnMetadata,
  keys: ordinaryOwnMetadataKeys,
  key: toMetaKey,
  exp: exp
};


/***/ }),

/***/ "./node_modules/core-js/modules/_object-assign.js":
/*!********************************************************!*\
  !*** ./node_modules/core-js/modules/_object-assign.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// 19.1.2.1 Object.assign(target, source, ...)
var DESCRIPTORS = __webpack_require__(/*! ./_descriptors */ "./node_modules/core-js/modules/_descriptors.js");
var getKeys = __webpack_require__(/*! ./_object-keys */ "./node_modules/core-js/modules/_object-keys.js");
var gOPS = __webpack_require__(/*! ./_object-gops */ "./node_modules/core-js/modules/_object-gops.js");
var pIE = __webpack_require__(/*! ./_object-pie */ "./node_modules/core-js/modules/_object-pie.js");
var toObject = __webpack_require__(/*! ./_to-object */ "./node_modules/core-js/modules/_to-object.js");
var IObject = __webpack_require__(/*! ./_iobject */ "./node_modules/core-js/modules/_iobject.js");
var $assign = Object.assign;

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = !$assign || __webpack_require__(/*! ./_fails */ "./node_modules/core-js/modules/_fails.js")(function () {
  var A = {};
  var B = {};
  // eslint-disable-next-line no-undef
  var S = Symbol();
  var K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function (k) { B[k] = k; });
  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
}) ? function assign(target, source) { // eslint-disable-line no-unused-vars
  var T = toObject(target);
  var aLen = arguments.length;
  var index = 1;
  var getSymbols = gOPS.f;
  var isEnum = pIE.f;
  while (aLen > index) {
    var S = IObject(arguments[index++]);
    var keys = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S);
    var length = keys.length;
    var j = 0;
    var key;
    while (length > j) {
      key = keys[j++];
      if (!DESCRIPTORS || isEnum.call(S, key)) T[key] = S[key];
    }
  } return T;
} : $assign;


/***/ }),

/***/ "./node_modules/core-js/modules/_object-create.js":
/*!********************************************************!*\
  !*** ./node_modules/core-js/modules/_object-create.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var dPs = __webpack_require__(/*! ./_object-dps */ "./node_modules/core-js/modules/_object-dps.js");
var enumBugKeys = __webpack_require__(/*! ./_enum-bug-keys */ "./node_modules/core-js/modules/_enum-bug-keys.js");
var IE_PROTO = __webpack_require__(/*! ./_shared-key */ "./node_modules/core-js/modules/_shared-key.js")('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = __webpack_require__(/*! ./_dom-create */ "./node_modules/core-js/modules/_dom-create.js")('iframe');
  var i = enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  __webpack_require__(/*! ./_html */ "./node_modules/core-js/modules/_html.js").appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};


/***/ }),

/***/ "./node_modules/core-js/modules/_object-dp.js":
/*!****************************************************!*\
  !*** ./node_modules/core-js/modules/_object-dp.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var IE8_DOM_DEFINE = __webpack_require__(/*! ./_ie8-dom-define */ "./node_modules/core-js/modules/_ie8-dom-define.js");
var toPrimitive = __webpack_require__(/*! ./_to-primitive */ "./node_modules/core-js/modules/_to-primitive.js");
var dP = Object.defineProperty;

exports.f = __webpack_require__(/*! ./_descriptors */ "./node_modules/core-js/modules/_descriptors.js") ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_object-dps.js":
/*!*****************************************************!*\
  !*** ./node_modules/core-js/modules/_object-dps.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var dP = __webpack_require__(/*! ./_object-dp */ "./node_modules/core-js/modules/_object-dp.js");
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var getKeys = __webpack_require__(/*! ./_object-keys */ "./node_modules/core-js/modules/_object-keys.js");

module.exports = __webpack_require__(/*! ./_descriptors */ "./node_modules/core-js/modules/_descriptors.js") ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) dP.f(O, P = keys[i++], Properties[P]);
  return O;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_object-gopd.js":
/*!******************************************************!*\
  !*** ./node_modules/core-js/modules/_object-gopd.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var pIE = __webpack_require__(/*! ./_object-pie */ "./node_modules/core-js/modules/_object-pie.js");
var createDesc = __webpack_require__(/*! ./_property-desc */ "./node_modules/core-js/modules/_property-desc.js");
var toIObject = __webpack_require__(/*! ./_to-iobject */ "./node_modules/core-js/modules/_to-iobject.js");
var toPrimitive = __webpack_require__(/*! ./_to-primitive */ "./node_modules/core-js/modules/_to-primitive.js");
var has = __webpack_require__(/*! ./_has */ "./node_modules/core-js/modules/_has.js");
var IE8_DOM_DEFINE = __webpack_require__(/*! ./_ie8-dom-define */ "./node_modules/core-js/modules/_ie8-dom-define.js");
var gOPD = Object.getOwnPropertyDescriptor;

exports.f = __webpack_require__(/*! ./_descriptors */ "./node_modules/core-js/modules/_descriptors.js") ? gOPD : function getOwnPropertyDescriptor(O, P) {
  O = toIObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return gOPD(O, P);
  } catch (e) { /* empty */ }
  if (has(O, P)) return createDesc(!pIE.f.call(O, P), O[P]);
};


/***/ }),

/***/ "./node_modules/core-js/modules/_object-gops.js":
/*!******************************************************!*\
  !*** ./node_modules/core-js/modules/_object-gops.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

exports.f = Object.getOwnPropertySymbols;


/***/ }),

/***/ "./node_modules/core-js/modules/_object-gpo.js":
/*!*****************************************************!*\
  !*** ./node_modules/core-js/modules/_object-gpo.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = __webpack_require__(/*! ./_has */ "./node_modules/core-js/modules/_has.js");
var toObject = __webpack_require__(/*! ./_to-object */ "./node_modules/core-js/modules/_to-object.js");
var IE_PROTO = __webpack_require__(/*! ./_shared-key */ "./node_modules/core-js/modules/_shared-key.js")('IE_PROTO');
var ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_object-keys-internal.js":
/*!***************************************************************!*\
  !*** ./node_modules/core-js/modules/_object-keys-internal.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var has = __webpack_require__(/*! ./_has */ "./node_modules/core-js/modules/_has.js");
var toIObject = __webpack_require__(/*! ./_to-iobject */ "./node_modules/core-js/modules/_to-iobject.js");
var arrayIndexOf = __webpack_require__(/*! ./_array-includes */ "./node_modules/core-js/modules/_array-includes.js")(false);
var IE_PROTO = __webpack_require__(/*! ./_shared-key */ "./node_modules/core-js/modules/_shared-key.js")('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_object-keys.js":
/*!******************************************************!*\
  !*** ./node_modules/core-js/modules/_object-keys.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = __webpack_require__(/*! ./_object-keys-internal */ "./node_modules/core-js/modules/_object-keys-internal.js");
var enumBugKeys = __webpack_require__(/*! ./_enum-bug-keys */ "./node_modules/core-js/modules/_enum-bug-keys.js");

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};


/***/ }),

/***/ "./node_modules/core-js/modules/_object-pie.js":
/*!*****************************************************!*\
  !*** ./node_modules/core-js/modules/_object-pie.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

exports.f = {}.propertyIsEnumerable;


/***/ }),

/***/ "./node_modules/core-js/modules/_property-desc.js":
/*!********************************************************!*\
  !*** ./node_modules/core-js/modules/_property-desc.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};


/***/ }),

/***/ "./node_modules/core-js/modules/_redefine-all.js":
/*!*******************************************************!*\
  !*** ./node_modules/core-js/modules/_redefine-all.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var redefine = __webpack_require__(/*! ./_redefine */ "./node_modules/core-js/modules/_redefine.js");
module.exports = function (target, src, safe) {
  for (var key in src) redefine(target, key, src[key], safe);
  return target;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_redefine.js":
/*!***************************************************!*\
  !*** ./node_modules/core-js/modules/_redefine.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(/*! ./_global */ "./node_modules/core-js/modules/_global.js");
var hide = __webpack_require__(/*! ./_hide */ "./node_modules/core-js/modules/_hide.js");
var has = __webpack_require__(/*! ./_has */ "./node_modules/core-js/modules/_has.js");
var SRC = __webpack_require__(/*! ./_uid */ "./node_modules/core-js/modules/_uid.js")('src');
var $toString = __webpack_require__(/*! ./_function-to-string */ "./node_modules/core-js/modules/_function-to-string.js");
var TO_STRING = 'toString';
var TPL = ('' + $toString).split(TO_STRING);

__webpack_require__(/*! ./_core */ "./node_modules/core-js/modules/_core.js").inspectSource = function (it) {
  return $toString.call(it);
};

(module.exports = function (O, key, val, safe) {
  var isFunction = typeof val == 'function';
  if (isFunction) has(val, 'name') || hide(val, 'name', key);
  if (O[key] === val) return;
  if (isFunction) has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
  if (O === global) {
    O[key] = val;
  } else if (!safe) {
    delete O[key];
    hide(O, key, val);
  } else if (O[key]) {
    O[key] = val;
  } else {
    hide(O, key, val);
  }
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, TO_STRING, function toString() {
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});


/***/ }),

/***/ "./node_modules/core-js/modules/_set-proto.js":
/*!****************************************************!*\
  !*** ./node_modules/core-js/modules/_set-proto.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var isObject = __webpack_require__(/*! ./_is-object */ "./node_modules/core-js/modules/_is-object.js");
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var check = function (O, proto) {
  anObject(O);
  if (!isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function (test, buggy, set) {
      try {
        set = __webpack_require__(/*! ./_ctx */ "./node_modules/core-js/modules/_ctx.js")(Function.call, __webpack_require__(/*! ./_object-gopd */ "./node_modules/core-js/modules/_object-gopd.js").f(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch (e) { buggy = true; }
      return function setPrototypeOf(O, proto) {
        check(O, proto);
        if (buggy) O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};


/***/ }),

/***/ "./node_modules/core-js/modules/_set-species.js":
/*!******************************************************!*\
  !*** ./node_modules/core-js/modules/_set-species.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(/*! ./_global */ "./node_modules/core-js/modules/_global.js");
var dP = __webpack_require__(/*! ./_object-dp */ "./node_modules/core-js/modules/_object-dp.js");
var DESCRIPTORS = __webpack_require__(/*! ./_descriptors */ "./node_modules/core-js/modules/_descriptors.js");
var SPECIES = __webpack_require__(/*! ./_wks */ "./node_modules/core-js/modules/_wks.js")('species');

module.exports = function (KEY) {
  var C = global[KEY];
  if (DESCRIPTORS && C && !C[SPECIES]) dP.f(C, SPECIES, {
    configurable: true,
    get: function () { return this; }
  });
};


/***/ }),

/***/ "./node_modules/core-js/modules/_set-to-string-tag.js":
/*!************************************************************!*\
  !*** ./node_modules/core-js/modules/_set-to-string-tag.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var def = __webpack_require__(/*! ./_object-dp */ "./node_modules/core-js/modules/_object-dp.js").f;
var has = __webpack_require__(/*! ./_has */ "./node_modules/core-js/modules/_has.js");
var TAG = __webpack_require__(/*! ./_wks */ "./node_modules/core-js/modules/_wks.js")('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};


/***/ }),

/***/ "./node_modules/core-js/modules/_shared-key.js":
/*!*****************************************************!*\
  !*** ./node_modules/core-js/modules/_shared-key.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var shared = __webpack_require__(/*! ./_shared */ "./node_modules/core-js/modules/_shared.js")('keys');
var uid = __webpack_require__(/*! ./_uid */ "./node_modules/core-js/modules/_uid.js");
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};


/***/ }),

/***/ "./node_modules/core-js/modules/_shared.js":
/*!*************************************************!*\
  !*** ./node_modules/core-js/modules/_shared.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var core = __webpack_require__(/*! ./_core */ "./node_modules/core-js/modules/_core.js");
var global = __webpack_require__(/*! ./_global */ "./node_modules/core-js/modules/_global.js");
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: core.version,
  mode: __webpack_require__(/*! ./_library */ "./node_modules/core-js/modules/_library.js") ? 'pure' : 'global',
  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
});


/***/ }),

/***/ "./node_modules/core-js/modules/_to-absolute-index.js":
/*!************************************************************!*\
  !*** ./node_modules/core-js/modules/_to-absolute-index.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var toInteger = __webpack_require__(/*! ./_to-integer */ "./node_modules/core-js/modules/_to-integer.js");
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};


/***/ }),

/***/ "./node_modules/core-js/modules/_to-integer.js":
/*!*****************************************************!*\
  !*** ./node_modules/core-js/modules/_to-integer.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};


/***/ }),

/***/ "./node_modules/core-js/modules/_to-iobject.js":
/*!*****************************************************!*\
  !*** ./node_modules/core-js/modules/_to-iobject.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = __webpack_require__(/*! ./_iobject */ "./node_modules/core-js/modules/_iobject.js");
var defined = __webpack_require__(/*! ./_defined */ "./node_modules/core-js/modules/_defined.js");
module.exports = function (it) {
  return IObject(defined(it));
};


/***/ }),

/***/ "./node_modules/core-js/modules/_to-length.js":
/*!****************************************************!*\
  !*** ./node_modules/core-js/modules/_to-length.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.15 ToLength
var toInteger = __webpack_require__(/*! ./_to-integer */ "./node_modules/core-js/modules/_to-integer.js");
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};


/***/ }),

/***/ "./node_modules/core-js/modules/_to-object.js":
/*!****************************************************!*\
  !*** ./node_modules/core-js/modules/_to-object.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.13 ToObject(argument)
var defined = __webpack_require__(/*! ./_defined */ "./node_modules/core-js/modules/_defined.js");
module.exports = function (it) {
  return Object(defined(it));
};


/***/ }),

/***/ "./node_modules/core-js/modules/_to-primitive.js":
/*!*******************************************************!*\
  !*** ./node_modules/core-js/modules/_to-primitive.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = __webpack_require__(/*! ./_is-object */ "./node_modules/core-js/modules/_is-object.js");
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};


/***/ }),

/***/ "./node_modules/core-js/modules/_uid.js":
/*!**********************************************!*\
  !*** ./node_modules/core-js/modules/_uid.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};


/***/ }),

/***/ "./node_modules/core-js/modules/_validate-collection.js":
/*!**************************************************************!*\
  !*** ./node_modules/core-js/modules/_validate-collection.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(/*! ./_is-object */ "./node_modules/core-js/modules/_is-object.js");
module.exports = function (it, TYPE) {
  if (!isObject(it) || it._t !== TYPE) throw TypeError('Incompatible receiver, ' + TYPE + ' required!');
  return it;
};


/***/ }),

/***/ "./node_modules/core-js/modules/_wks.js":
/*!**********************************************!*\
  !*** ./node_modules/core-js/modules/_wks.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var store = __webpack_require__(/*! ./_shared */ "./node_modules/core-js/modules/_shared.js")('wks');
var uid = __webpack_require__(/*! ./_uid */ "./node_modules/core-js/modules/_uid.js");
var Symbol = __webpack_require__(/*! ./_global */ "./node_modules/core-js/modules/_global.js").Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;


/***/ }),

/***/ "./node_modules/core-js/modules/core.get-iterator-method.js":
/*!******************************************************************!*\
  !*** ./node_modules/core-js/modules/core.get-iterator-method.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var classof = __webpack_require__(/*! ./_classof */ "./node_modules/core-js/modules/_classof.js");
var ITERATOR = __webpack_require__(/*! ./_wks */ "./node_modules/core-js/modules/_wks.js")('iterator');
var Iterators = __webpack_require__(/*! ./_iterators */ "./node_modules/core-js/modules/_iterators.js");
module.exports = __webpack_require__(/*! ./_core */ "./node_modules/core-js/modules/_core.js").getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};


/***/ }),

/***/ "./node_modules/core-js/modules/es6.map.js":
/*!*************************************************!*\
  !*** ./node_modules/core-js/modules/es6.map.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var strong = __webpack_require__(/*! ./_collection-strong */ "./node_modules/core-js/modules/_collection-strong.js");
var validate = __webpack_require__(/*! ./_validate-collection */ "./node_modules/core-js/modules/_validate-collection.js");
var MAP = 'Map';

// 23.1 Map Objects
module.exports = __webpack_require__(/*! ./_collection */ "./node_modules/core-js/modules/_collection.js")(MAP, function (get) {
  return function Map() { return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.1.3.6 Map.prototype.get(key)
  get: function get(key) {
    var entry = strong.getEntry(validate(this, MAP), key);
    return entry && entry.v;
  },
  // 23.1.3.9 Map.prototype.set(key, value)
  set: function set(key, value) {
    return strong.def(validate(this, MAP), key === 0 ? 0 : key, value);
  }
}, strong, true);


/***/ }),

/***/ "./node_modules/core-js/modules/es6.set.js":
/*!*************************************************!*\
  !*** ./node_modules/core-js/modules/es6.set.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var strong = __webpack_require__(/*! ./_collection-strong */ "./node_modules/core-js/modules/_collection-strong.js");
var validate = __webpack_require__(/*! ./_validate-collection */ "./node_modules/core-js/modules/_validate-collection.js");
var SET = 'Set';

// 23.2 Set Objects
module.exports = __webpack_require__(/*! ./_collection */ "./node_modules/core-js/modules/_collection.js")(SET, function (get) {
  return function Set() { return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.2.3.1 Set.prototype.add(value)
  add: function add(value) {
    return strong.def(validate(this, SET), value = value === 0 ? 0 : value, value);
  }
}, strong);


/***/ }),

/***/ "./node_modules/core-js/modules/es6.weak-map.js":
/*!******************************************************!*\
  !*** ./node_modules/core-js/modules/es6.weak-map.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(/*! ./_global */ "./node_modules/core-js/modules/_global.js");
var each = __webpack_require__(/*! ./_array-methods */ "./node_modules/core-js/modules/_array-methods.js")(0);
var redefine = __webpack_require__(/*! ./_redefine */ "./node_modules/core-js/modules/_redefine.js");
var meta = __webpack_require__(/*! ./_meta */ "./node_modules/core-js/modules/_meta.js");
var assign = __webpack_require__(/*! ./_object-assign */ "./node_modules/core-js/modules/_object-assign.js");
var weak = __webpack_require__(/*! ./_collection-weak */ "./node_modules/core-js/modules/_collection-weak.js");
var isObject = __webpack_require__(/*! ./_is-object */ "./node_modules/core-js/modules/_is-object.js");
var validate = __webpack_require__(/*! ./_validate-collection */ "./node_modules/core-js/modules/_validate-collection.js");
var NATIVE_WEAK_MAP = __webpack_require__(/*! ./_validate-collection */ "./node_modules/core-js/modules/_validate-collection.js");
var IS_IE11 = !global.ActiveXObject && 'ActiveXObject' in global;
var WEAK_MAP = 'WeakMap';
var getWeak = meta.getWeak;
var isExtensible = Object.isExtensible;
var uncaughtFrozenStore = weak.ufstore;
var InternalMap;

var wrapper = function (get) {
  return function WeakMap() {
    return get(this, arguments.length > 0 ? arguments[0] : undefined);
  };
};

var methods = {
  // 23.3.3.3 WeakMap.prototype.get(key)
  get: function get(key) {
    if (isObject(key)) {
      var data = getWeak(key);
      if (data === true) return uncaughtFrozenStore(validate(this, WEAK_MAP)).get(key);
      return data ? data[this._i] : undefined;
    }
  },
  // 23.3.3.5 WeakMap.prototype.set(key, value)
  set: function set(key, value) {
    return weak.def(validate(this, WEAK_MAP), key, value);
  }
};

// 23.3 WeakMap Objects
var $WeakMap = module.exports = __webpack_require__(/*! ./_collection */ "./node_modules/core-js/modules/_collection.js")(WEAK_MAP, wrapper, methods, weak, true, true);

// IE11 WeakMap frozen keys fix
if (NATIVE_WEAK_MAP && IS_IE11) {
  InternalMap = weak.getConstructor(wrapper, WEAK_MAP);
  assign(InternalMap.prototype, methods);
  meta.NEED = true;
  each(['delete', 'has', 'get', 'set'], function (key) {
    var proto = $WeakMap.prototype;
    var method = proto[key];
    redefine(proto, key, function (a, b) {
      // store frozen objects on internal weakmap shim
      if (isObject(a) && !isExtensible(a)) {
        if (!this._f) this._f = new InternalMap();
        var result = this._f[key](a, b);
        return key == 'set' ? this : result;
      // store all the rest on native weakmap
      } return method.call(this, a, b);
    });
  });
}


/***/ }),

/***/ "./node_modules/core-js/modules/es7.reflect.define-metadata.js":
/*!*********************************************************************!*\
  !*** ./node_modules/core-js/modules/es7.reflect.define-metadata.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var metadata = __webpack_require__(/*! ./_metadata */ "./node_modules/core-js/modules/_metadata.js");
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var toMetaKey = metadata.key;
var ordinaryDefineOwnMetadata = metadata.set;

metadata.exp({ defineMetadata: function defineMetadata(metadataKey, metadataValue, target, targetKey) {
  ordinaryDefineOwnMetadata(metadataKey, metadataValue, anObject(target), toMetaKey(targetKey));
} });


/***/ }),

/***/ "./node_modules/core-js/modules/es7.reflect.delete-metadata.js":
/*!*********************************************************************!*\
  !*** ./node_modules/core-js/modules/es7.reflect.delete-metadata.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var metadata = __webpack_require__(/*! ./_metadata */ "./node_modules/core-js/modules/_metadata.js");
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var toMetaKey = metadata.key;
var getOrCreateMetadataMap = metadata.map;
var store = metadata.store;

metadata.exp({ deleteMetadata: function deleteMetadata(metadataKey, target /* , targetKey */) {
  var targetKey = arguments.length < 3 ? undefined : toMetaKey(arguments[2]);
  var metadataMap = getOrCreateMetadataMap(anObject(target), targetKey, false);
  if (metadataMap === undefined || !metadataMap['delete'](metadataKey)) return false;
  if (metadataMap.size) return true;
  var targetMetadata = store.get(target);
  targetMetadata['delete'](targetKey);
  return !!targetMetadata.size || store['delete'](target);
} });


/***/ }),

/***/ "./node_modules/core-js/modules/es7.reflect.get-metadata-keys.js":
/*!***********************************************************************!*\
  !*** ./node_modules/core-js/modules/es7.reflect.get-metadata-keys.js ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Set = __webpack_require__(/*! ./es6.set */ "./node_modules/core-js/modules/es6.set.js");
var from = __webpack_require__(/*! ./_array-from-iterable */ "./node_modules/core-js/modules/_array-from-iterable.js");
var metadata = __webpack_require__(/*! ./_metadata */ "./node_modules/core-js/modules/_metadata.js");
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var getPrototypeOf = __webpack_require__(/*! ./_object-gpo */ "./node_modules/core-js/modules/_object-gpo.js");
var ordinaryOwnMetadataKeys = metadata.keys;
var toMetaKey = metadata.key;

var ordinaryMetadataKeys = function (O, P) {
  var oKeys = ordinaryOwnMetadataKeys(O, P);
  var parent = getPrototypeOf(O);
  if (parent === null) return oKeys;
  var pKeys = ordinaryMetadataKeys(parent, P);
  return pKeys.length ? oKeys.length ? from(new Set(oKeys.concat(pKeys))) : pKeys : oKeys;
};

metadata.exp({ getMetadataKeys: function getMetadataKeys(target /* , targetKey */) {
  return ordinaryMetadataKeys(anObject(target), arguments.length < 2 ? undefined : toMetaKey(arguments[1]));
} });


/***/ }),

/***/ "./node_modules/core-js/modules/es7.reflect.get-metadata.js":
/*!******************************************************************!*\
  !*** ./node_modules/core-js/modules/es7.reflect.get-metadata.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var metadata = __webpack_require__(/*! ./_metadata */ "./node_modules/core-js/modules/_metadata.js");
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var getPrototypeOf = __webpack_require__(/*! ./_object-gpo */ "./node_modules/core-js/modules/_object-gpo.js");
var ordinaryHasOwnMetadata = metadata.has;
var ordinaryGetOwnMetadata = metadata.get;
var toMetaKey = metadata.key;

var ordinaryGetMetadata = function (MetadataKey, O, P) {
  var hasOwn = ordinaryHasOwnMetadata(MetadataKey, O, P);
  if (hasOwn) return ordinaryGetOwnMetadata(MetadataKey, O, P);
  var parent = getPrototypeOf(O);
  return parent !== null ? ordinaryGetMetadata(MetadataKey, parent, P) : undefined;
};

metadata.exp({ getMetadata: function getMetadata(metadataKey, target /* , targetKey */) {
  return ordinaryGetMetadata(metadataKey, anObject(target), arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
} });


/***/ }),

/***/ "./node_modules/core-js/modules/es7.reflect.get-own-metadata-keys.js":
/*!***************************************************************************!*\
  !*** ./node_modules/core-js/modules/es7.reflect.get-own-metadata-keys.js ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var metadata = __webpack_require__(/*! ./_metadata */ "./node_modules/core-js/modules/_metadata.js");
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var ordinaryOwnMetadataKeys = metadata.keys;
var toMetaKey = metadata.key;

metadata.exp({ getOwnMetadataKeys: function getOwnMetadataKeys(target /* , targetKey */) {
  return ordinaryOwnMetadataKeys(anObject(target), arguments.length < 2 ? undefined : toMetaKey(arguments[1]));
} });


/***/ }),

/***/ "./node_modules/core-js/modules/es7.reflect.get-own-metadata.js":
/*!**********************************************************************!*\
  !*** ./node_modules/core-js/modules/es7.reflect.get-own-metadata.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var metadata = __webpack_require__(/*! ./_metadata */ "./node_modules/core-js/modules/_metadata.js");
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var ordinaryGetOwnMetadata = metadata.get;
var toMetaKey = metadata.key;

metadata.exp({ getOwnMetadata: function getOwnMetadata(metadataKey, target /* , targetKey */) {
  return ordinaryGetOwnMetadata(metadataKey, anObject(target)
    , arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
} });


/***/ }),

/***/ "./node_modules/core-js/modules/es7.reflect.has-metadata.js":
/*!******************************************************************!*\
  !*** ./node_modules/core-js/modules/es7.reflect.has-metadata.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var metadata = __webpack_require__(/*! ./_metadata */ "./node_modules/core-js/modules/_metadata.js");
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var getPrototypeOf = __webpack_require__(/*! ./_object-gpo */ "./node_modules/core-js/modules/_object-gpo.js");
var ordinaryHasOwnMetadata = metadata.has;
var toMetaKey = metadata.key;

var ordinaryHasMetadata = function (MetadataKey, O, P) {
  var hasOwn = ordinaryHasOwnMetadata(MetadataKey, O, P);
  if (hasOwn) return true;
  var parent = getPrototypeOf(O);
  return parent !== null ? ordinaryHasMetadata(MetadataKey, parent, P) : false;
};

metadata.exp({ hasMetadata: function hasMetadata(metadataKey, target /* , targetKey */) {
  return ordinaryHasMetadata(metadataKey, anObject(target), arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
} });


/***/ }),

/***/ "./node_modules/core-js/modules/es7.reflect.has-own-metadata.js":
/*!**********************************************************************!*\
  !*** ./node_modules/core-js/modules/es7.reflect.has-own-metadata.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var metadata = __webpack_require__(/*! ./_metadata */ "./node_modules/core-js/modules/_metadata.js");
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var ordinaryHasOwnMetadata = metadata.has;
var toMetaKey = metadata.key;

metadata.exp({ hasOwnMetadata: function hasOwnMetadata(metadataKey, target /* , targetKey */) {
  return ordinaryHasOwnMetadata(metadataKey, anObject(target)
    , arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
} });


/***/ }),

/***/ "./node_modules/core-js/modules/es7.reflect.metadata.js":
/*!**************************************************************!*\
  !*** ./node_modules/core-js/modules/es7.reflect.metadata.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var $metadata = __webpack_require__(/*! ./_metadata */ "./node_modules/core-js/modules/_metadata.js");
var anObject = __webpack_require__(/*! ./_an-object */ "./node_modules/core-js/modules/_an-object.js");
var aFunction = __webpack_require__(/*! ./_a-function */ "./node_modules/core-js/modules/_a-function.js");
var toMetaKey = $metadata.key;
var ordinaryDefineOwnMetadata = $metadata.set;

$metadata.exp({ metadata: function metadata(metadataKey, metadataValue) {
  return function decorator(target, targetKey) {
    ordinaryDefineOwnMetadata(
      metadataKey, metadataValue,
      (targetKey !== undefined ? anObject : aFunction)(target),
      toMetaKey(targetKey)
    );
  };
} });


/***/ }),

/***/ "./src/$$_lazy_route_resource lazy recursive":
/*!**********************************************************!*\
  !*** ./src/$$_lazy_route_resource lazy namespace object ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncaught exception popping up in devtools
	return Promise.resolve().then(function() {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "./src/$$_lazy_route_resource lazy recursive";

/***/ }),

/***/ "./src/app/app-routing.module.ts":
/*!***************************************!*\
  !*** ./src/app/app-routing.module.ts ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const router_1 = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm2015/router.js");
const geoweb_component_1 = __webpack_require__(/*! ./geo-web/geoweb.component */ "./src/app/geo-web/geoweb.component.ts");
const home_component_1 = __webpack_require__(/*! ./home/home.component */ "./src/app/home/home.component.ts");
const login_component_1 = __webpack_require__(/*! ./login/login.component */ "./src/app/login/login.component.ts");
const routes = [
    { path: "", component: home_component_1.HomeComponent },
    { path: "job", component: geoweb_component_1.GeowebComponent },
    { path: "login", component: login_component_1.LoginComponent },
];
let AppRoutingModule = class AppRoutingModule {
};
AppRoutingModule = __decorate([
    core_1.NgModule({
        imports: [router_1.RouterModule.forRoot(routes)],
        exports: [router_1.RouterModule],
    })
], AppRoutingModule);
exports.AppRoutingModule = AppRoutingModule;


/***/ }),

/***/ "./src/app/app.component.html":
/*!************************************!*\
  !*** ./src/app/app.component.html ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<router-outlet></router-outlet>\n<p-toast position=\"top-right\"\n  baseZIndex=\"2000\"></p-toast>"

/***/ }),

/***/ "./src/app/app.component.scss":
/*!************************************!*\
  !*** ./src/app/app.component.scss ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "* {\n  box-sizing: border-box; }\n\nbody,\nhtml {\n  font-family: Roboto, \"Helvetica Neue\", Helvetica, Arial, sans-serif !important;\n  font-size: 14px;\n  margin: 0;\n  padding: 0; }\n\n.c3 text {\n  font-family: Roboto, \"Helvetica Neue\", Helvetica, Arial, sans-serif !important;\n  font-size: 14px; }\n\nh1,\n.h1 {\n  font-size: 24px;\n  font-weight: 600; }\n\nh2,\n.h2 {\n  font-size: 18px;\n  font-weight: 500; }\n\npre {\n  word-break: break-word;\n  overflow-x: auto;\n  white-space: pre-wrap;\n  white-space: -moz-pre-wrap;\n  white-space: -pre-wrap;\n  white-space: -o-pre-wrap;\n  word-wrap: break-word; }\n\n.font-italic-light {\n  font-weight: 100;\n  font-style: italic; }\n\n.text-overflow-ellipsis {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis; }\n\n.label,\nlabel {\n  display: block;\n  margin-bottom: 10px;\n  margin-top: 20px; }\n\n.badge > .pi {\n  padding-right: 4px; }\n\na.icon-link:last-of-type {\n  padding-right: 10px; }\n\na.icon-link:first-of-type {\n  padding-left: 10px; }\n\na.icon-link {\n  font-size: 0.85em;\n  padding: 0 5px; }\n\nbody .ui-widget-overlay {\n  background-color: rgba(0, 0, 0, 0.2);\n  transition: all linear 0.2s; }\n\n.ui-state-highlight a.icon-link {\n  color: #ffffff; }\n\n.ui-state-highlight a.icon-link:hover {\n  color: #ffffffba; }\n\n.empty-placeholder {\n  color: #999;\n  font-weight: 100;\n  padding: 20px 0;\n  /* height: 100%; */\n  text-align: center; }\n\n.ui-toast {\n  max-height: 100vh;\n  overflow-y: auto; }\n\n.ui-toast-detail {\n  word-break: break-word; }\n\n.modal-dialog.ui-dialog {\n  width: 400px; }\n\n.ui-dialog .ui-grid .ui-grid-row {\n  margin-bottom: 10px; }\n\n.ui-dialog .ui-listbox .ui-listbox-list-wrapper {\n  max-height: calc(100vh - 400px);\n  min-height: 100px; }\n\nbody .ui-dialog .ui-dialog-content {\n  max-height: calc(100vh - 200px);\n  min-height: 200px;\n  overflow-y: auto;\n  overflow-y: overlay;\n  -ms-overflow-style: -ms-autohiding-scrollbar;\n  border-left: none;\n  border-right: none; }\n\nbody .ui-dialog .ui-dialog-titlebar,\nbody .ui-dialog .ui-dialog-footer {\n  border-left: none;\n  border-right: none; }\n\nbody .ui-dialog .ui-dialog-titlebar {\n  border-top: none; }\n\nbody .ui-dialog .ui-dialog-footer {\n  border-bottom: none; }\n\n.ui-dialog .ui-listbox .ui-progressbar {\n  display: inline-block;\n  width: 100%;\n  height: 14px;\n  margin-top: 3px;\n  margin-bottom: -3px;\n  background-color: #0000004a; }\n\n.ui-dialog .ui-listbox .ui-progressbar .ui-progressbar-label {\n  font-size: 12px;\n  line-height: 1.25;\n  color: inherit; }\n\n.ui-dialog .ui-listbox .ui-progressbar .ui-progressbar-value {\n  background: #0000006b; }\n\nbody .ui-widget,\nbody\n.ui-autocomplete.ui-autocomplete-multiple\n.ui-autocomplete-multiple-container\n.ui-autocomplete-input-token\ninput,\nbody .ui-chips > ul.ui-inputtext .ui-chips-input-token input,\nbody .ui-table .ui-editable-column input,\nbody .ui-treetable .ui-editable-column input,\nbody .ui-terminal .ui-terminal-input {\n  font-family: Roboto, \"Helvetica Neue\", Helvetica, Arial, sans-serif !important; }\n\nbody .secondary-col,\nbody .ui-button.ui-state-default.ui-button-secondary,\nbody .ui-buttonset.ui-button-secondary > .ui-button.ui-state-default {\n  color: #333333;\n  background-color: #e8e8e8;\n  border-color: #e8e8e8; }\n\nbody .secondary-col:hover,\nbody .ui-button.ui-state-default.ui-button-secondary:enabled:hover,\nbody\n.ui-buttonset.ui-button-secondary\n> .ui-button.ui-state-default:enabled:hover {\n  background-color: #c8c8c8;\n  color: #333333;\n  border-color: #c8c8c8; }\n\nbody .secondary-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-secondary:enabled:focus,\nbody\n.ui-buttonset.ui-button-secondary\n> .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #8dcdff; }\n\nbody .secondary-col:active,\nbody .ui-button.ui-state-default.ui-button-secondary:enabled:active,\nbody\n.ui-buttonset.ui-button-secondary\n> .ui-button.ui-state-default:enabled:active {\n  background-color: #a0a0a0;\n  color: #333333;\n  border-color: #a0a0a0; }\n\nbody .default-col,\nbody .ui-button.ui-state-default.ui-button-info,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default {\n  color: #ffffff;\n  background-color: #007ad9;\n  border-color: #007ad9; }\n\nbody .default-col:hover,\nbody .ui-button.ui-state-default.ui-button-info:enabled:hover,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default:enabled:hover {\n  background-color: #116fbf;\n  color: #ffffff;\n  border-color: #116fbf; }\n\nbody .default-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-info:enabled:focus,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #8dcdff; }\n\nbody .default-col:active,\nbody .ui-button.ui-state-default.ui-button-info:enabled:active,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default:enabled:active {\n  background-color: #005b9f;\n  color: #ffffff;\n  border-color: #005b9f; }\n\nbody .success-col,\nbody .ui-button.ui-state-default.ui-button-success,\nbody .ui-buttonset.ui-button-success > .ui-button.ui-state-default {\n  color: #ffffff;\n  background-color: #34a835;\n  border-color: #34a835; }\n\nbody .success-col:hover,\nbody .ui-button.ui-state-default.ui-button-success:enabled:hover,\nbody\n.ui-buttonset.ui-button-success\n> .ui-button.ui-state-default:enabled:hover {\n  background-color: #107d11;\n  color: #ffffff;\n  border-color: #107d11; }\n\nbody .success-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-success:enabled:focus,\nbody\n.ui-buttonset.ui-button-success\n> .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #aae5aa; }\n\nbody .success-col:active,\nbody .ui-button.ui-state-default.ui-button-success:enabled:active,\nbody\n.ui-buttonset.ui-button-success\n> .ui-button.ui-state-default:enabled:active {\n  background-color: #0c6b0d;\n  color: #ffffff;\n  border-color: #0c6b0d; }\n\nbody .success-col-outline,\nbody .ui-button.ui-state-default.ui-button-success-outline,\nbody .ui-buttonset.ui-button-success-outline > .ui-button.ui-state-default {\n  color: #34a835;\n  background-color: #fff;\n  border-color: #fff; }\n\nbody .success-col-outline:hover,\nbody .ui-button.ui-state-default.ui-button-success-outline:enabled:hover,\nbody\n.ui-buttonset.ui-button-success-outline\n> .ui-button.ui-state-default:enabled:hover {\n  background-color: #fff;\n  color: #107d11;\n  border-color: #fff; }\n\nbody .success-col-outline:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-success-outline:enabled:focus,\nbody\n.ui-buttonset.ui-button-success-outline\n> .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #aae5aa; }\n\nbody .success-col-outline:active,\nbody .ui-button.ui-state-default.ui-button-success-outline:enabled:active,\nbody\n.ui-buttonset.ui-button-success-outline\n> .ui-button.ui-state-default:enabled:active {\n  background-color: #fff;\n  color: #0c6b0d;\n  border-color: #fff; }\n\nbody .warning-col,\nbody .ui-button.ui-state-default.ui-button-warning,\nbody .ui-buttonset.ui-button-warning > .ui-button.ui-state-default {\n  color: #333333;\n  background-color: #ffba01;\n  border-color: #ffba01; }\n\nbody .warning-col:hover,\nbody .ui-button.ui-state-default.ui-button-warning:enabled:hover,\nbody\n.ui-buttonset.ui-button-warning\n> .ui-button.ui-state-default:enabled:hover {\n  background-color: #ed990b;\n  color: #333333;\n  border-color: #ed990b; }\n\nbody .warning-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-warning:enabled:focus,\nbody\n.ui-buttonset.ui-button-warning\n> .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #ffeab4; }\n\nbody .warning-col:active,\nbody .ui-button.ui-state-default.ui-button-warning:enabled:active,\nbody\n.ui-buttonset.ui-button-warning\n> .ui-button.ui-state-default:enabled:active {\n  background-color: #d38b10;\n  color: #333333;\n  border-color: #d38b10; }\n\nbody .danger-col,\nbody .ui-button.ui-state-default.ui-button-danger,\nbody .ui-buttonset.ui-button-danger > .ui-button.ui-state-default {\n  color: #ffffff;\n  background-color: #e91224;\n  border-color: #e91224; }\n\nbody .danger-col:hover,\nbody .ui-button.ui-state-default.ui-button-danger:enabled:hover,\nbody\n.ui-buttonset.ui-button-danger\n> .ui-button.ui-state-default:enabled:hover {\n  background-color: #c01120;\n  color: #ffffff;\n  border-color: #c01120; }\n\nbody .danger-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-danger:enabled:focus,\nbody\n.ui-buttonset.ui-button-danger\n> .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #f9b4ba; }\n\nbody .danger-col:active,\nbody .ui-button.ui-state-default.ui-button-danger:enabled:active,\nbody\n.ui-buttonset.ui-button-danger\n> .ui-button.ui-state-default:enabled:active {\n  background-color: #a90000;\n  color: #ffffff;\n  border-color: #a90000; }\n\nbody .danger-col-outline,\nbody .ui-button.ui-state-default.ui-button-danger-outline,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default {\n  color: #e91224;\n  background-color: #fff;\n  border-color: #fff; }\n\nbody .ui-button.ui-state-default.ui-button-danger-outline,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default {\n  border-color: #e91224; }\n\nbody .danger-col-outline:hover,\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:hover,\nbody\n.ui-buttonset.ui-button-danger-outline\n> .ui-button.ui-state-default:enabled:hover {\n  background-color: #fff;\n  color: #c01120;\n  border-color: #fff; }\n\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:hover,\nbody\n.ui-buttonset.ui-button-danger-outline\n> .ui-button.ui-state-default:enabled:hover {\n  border-color: #c01120; }\n\nbody .danger-col-outline:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:focus,\nbody\n.ui-buttonset.ui-button-danger-outline\n> .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #f9b4ba; }\n\nbody .danger-col-outline:active,\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:active,\nbody\n.ui-buttonset.ui-button-danger-outline\n> .ui-button.ui-state-default:enabled:active {\n  background-color: #fff;\n  color: #a90000;\n  border-color: #fff; }\n\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:active,\nbody\n.ui-buttonset.ui-button-danger-outline\n> .ui-button.ui-state-default:enabled:active {\n  border-color: #a90000; }\n\nbody .ui-dialog .ui-dialog-footer button,\nbody .ui-card .ui-card-footer button {\n  margin: 0 0 0 0.5em !important; }\n\nbody .ui-dialog {\n  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1) !important; }\n\nbody .ui-dialog .ui-dialog-titlebar {\n  border-radius: 4px 4px 0 0; }\n\nbody .ui-dialog .ui-dialog-footer {\n  border-radius: 0 0 4px 4px; }\n\nbody .ui-messages-error {\n  border: none;\n  font-weight: 800;\n  padding: 0;\n  display: block;\n  width: 100%;\n  text-align: right;\n  color: #a80000; }\n\nbody .ng-dirty.ng-invalid + ul {\n  -webkit-padding-start: 0;\n          padding-inline-start: 0; }\n\nbody .ui-inputtext.ng-invalid:enabled:focus,\n.ui-inputtext {\n  border-color: #a80000; }\n\nbody .ui-inputtext,\nbody .ui-inputgroup .ui-inputtext.ng-dirty.ng-invalid + .ui-inputgroup-addon {\n  transition: box-shadow 0.2s; }\n\nbody .ui-inputtext.ng-dirty.ng-invalid,\nbody p-dropdown.ng-dirty.ng-invalid > .ui-dropdown,\nbody p-autocomplete.ng-dirty.ng-invalid > .ui-autocomplete > .ui-inputtext,\nbody p-calendar.ng-dirty.ng-invalid > .ui-calendar > .ui-inputtext,\nbody p-chips.ng-dirty.ng-invalid > .ui-inputtext,\nbody p-inputmask.ng-dirty.ng-invalid > .ui-inputtext,\nbody p-checkbox.ng-dirty.ng-invalid .ui-chkbox-box,\nbody p-radiobutton.ng-dirty.ng-invalid .ui-radiobutton-box,\nbody p-inputswitch.ng-dirty.ng-invalid .ui-inputswitch,\nbody p-listbox.ng-dirty.ng-invalid .ui-inputtext,\nbody p-multiselect.ng-dirty.ng-invalid > .ui-multiselect,\nbody p-spinner.ng-dirty.ng-invalid > .ui-inputtext,\nbody p-selectbutton.ng-dirty.ng-invalid .ui-button,\nbody p-togglebutton.ng-dirty.ng-invalid .ui-button {\n  box-shadow: 0 0 0 0.2em #f9b4ba; }\n\nbody .ui-inputgroup .ui-inputtext.ng-dirty.ng-invalid + .ui-inputgroup-addon {\n  box-shadow: 2px -2.8px 0 #f9b4ba, 2px 2.8px 0 #f9b4ba; }\n\nbody p-calendar.ng-dirty.ng-invalid > .ui-calendar.ui-calendar-w-btn {\n  box-shadow: 0 0 0 3px #f9b4ba;\n  border-radius: 4px; }\n\nbody\n.ui-inputgroup\n.ui-inputtext:enabled:focus:not(.ui-state-error)\n+ .ui-inputgroup-addon,\nbody\np-calendar.ng-dirty.ng-invalid\n> .ui-calendar\n> .ui-inputtext:enabled:focus:not(.ui-state-error),\nbody\np-calendar.ng-dirty.ng-invalid\n> .ui-calendar\n> .ui-inputtext:enabled:focus:not(.ui-state-error)\n+ .ui-calendar-button {\n  box-shadow: none; }\n\n*:not(.ui-calendar) .ui-inputtext {\n  width: 100%; }\n\nbody .ui-state-disabled,\nbody .ui-widget:disabled {\n  cursor: not-allowed; }\n\n.form dynamic-primeng-form-control > div {\n  margin-bottom: 10px; }\n\n.form .ui-calendar,\n.form .ui-spinner {\n  width: 100%; }\n\n.form .ui-calendar-w-btn input.ui-inputtext {\n  width: calc(100% - 33px); }\n\n.form .ui-datepicker {\n  padding: 0.5em; }\n\n.form .ui-datepicker {\n  font-size: 12px; }\n\n.form .ui-datepicker .ui-timepicker {\n  padding: 10px 0 0 0;\n  font-size: 11px; }\n\n.form .ui-datepicker table {\n  font-size: 11px; }\n\n/* width */\n\n::-webkit-scrollbar {\n  width: 10px; }\n\n/* Track */\n\n::-webkit-scrollbar-track {\n  background: none; }\n\n/* Handle */\n\n::-webkit-scrollbar-thumb {\n  background: #00000033;\n  border: 2px solid rgba(0, 0, 0, 0);\n  background-clip: padding-box;\n  border-radius: 5px; }\n\n/* Handle on hover */\n\n::-webkit-scrollbar-thumb:hover {\n  background: #00000055;\n  background-clip: padding-box; }\n\n.ui-toast-top-right {\n  top: 8px;\n  right: 8px; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYXdhbm1hY2Jvb2svRG9jdW1lbnRzL2Rzcy9jbGllbnQvc3JjL3N0eWxlcy5zY3NzIiwiL1VzZXJzL3Bhd2FubWFjYm9vay9Eb2N1bWVudHMvZHNzL2NsaWVudC9zcmMvYXBwL2FwcC5jb21wb25lbnQuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLHNCQUFzQixFQUFBOztBQUd4Qjs7RUFFRSw4RUFBOEU7RUFDOUUsZUFBZTtFQUNmLFNBQVM7RUFDVCxVQUFVLEVBQUE7O0FBR1o7RUFDRSw4RUFBOEU7RUFDOUUsZUFBZSxFQUFBOztBQUdqQjs7RUFFRSxlQUFlO0VBQ2YsZ0JBQWdCLEVBQUE7O0FBR2xCOztFQUVFLGVBQWU7RUFDZixnQkFBZ0IsRUFBQTs7QUFPbEI7RUFDRSxzQkFBc0I7RUFDdEIsZ0JBQWdCO0VBQ2hCLHFCQUFxQjtFQUNyQiwwQkFBMEI7RUFDMUIsc0JBQXNCO0VBQ3RCLHdCQUF3QjtFQUN4QixxQkFBcUIsRUFBQTs7QUFHdkI7RUFDRSxnQkFBZ0I7RUFDaEIsa0JBQWtCLEVBQUE7O0FBR3BCO0VBQ0UsbUJBQW1CO0VBQ25CLGdCQUFnQjtFQUNoQix1QkFBdUIsRUFBQTs7QUFHekI7O0VBRUUsY0FBYztFQUNkLG1CQUFtQjtFQUNuQixnQkFBZ0IsRUFBQTs7QUFHbEI7RUFDRSxrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxtQkFBbUIsRUFBQTs7QUFHckI7RUFDRSxrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxpQkFBaUI7RUFDakIsY0FBYyxFQUFBOztBQUdoQjtFQUNFLG9DQUFvQztFQUNwQywyQkFBMkIsRUFBQTs7QUFHN0I7RUFDRSxjQUFjLEVBQUE7O0FBR2hCO0VBQ0UsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0UsV0FBVztFQUNYLGdCQUFnQjtFQUNoQixlQUFlO0VBQ2Ysa0JBQUE7RUFDQSxrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxpQkFBaUI7RUFDakIsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0Usc0JBQXNCLEVBQUE7O0FBR3hCO0VBQ0UsWUFBWSxFQUFBOztBQUlkO0VBQ0UsbUJBQW1CLEVBQUE7O0FBR3JCO0VBQ0UsK0JBQStCO0VBQy9CLGlCQUFpQixFQUFBOztBQUduQjtFQUNFLCtCQUErQjtFQUMvQixpQkFBaUI7RUFDakIsZ0JBQWdCO0VBQ2hCLG1CQUFtQjtFQUVuQiw0Q0FBNEM7RUFFNUMsaUJBQWlCO0VBQ2pCLGtCQUFrQixFQUFBOztBQUdwQjs7RUFFRSxpQkFBaUI7RUFDakIsa0JBQWtCLEVBQUE7O0FBR3BCO0VBQ0UsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0UsbUJBQW1CLEVBQUE7O0FBR3JCO0VBQ0UscUJBQXFCO0VBQ3JCLFdBQVc7RUFDWCxZQUFZO0VBQ1osZUFBZTtFQUNmLG1CQUFtQjtFQUNuQiwyQkFBMkIsRUFBQTs7QUFJN0I7RUFDRSxlQUFlO0VBQ2YsaUJBQWlCO0VBQ2pCLGNBQWMsRUFBQTs7QUFHaEI7RUFDRSxxQkFBcUIsRUFBQTs7QUFJdkI7Ozs7Ozs7Ozs7RUFVRSw4RUFBOEUsRUFBQTs7QUFJaEY7OztFQUdFLGNBQWM7RUFDZCx5QkFBeUI7RUFDekIscUJBQXFCLEVBQUE7O0FBRXZCOzs7OztFQUtFLHlCQUF5QjtFQUN6QixjQUFjO0VBQ2QscUJBQXFCLEVBQUE7O0FBR3ZCOzs7OztFQU9FLCtCQUErQixFQUFBOztBQUVqQzs7Ozs7RUFLRSx5QkFBeUI7RUFDekIsY0FBYztFQUNkLHFCQUFxQixFQUFBOztBQUV2Qjs7O0VBR0UsY0FBYztFQUNkLHlCQUF5QjtFQUN6QixxQkFBcUIsRUFBQTs7QUFFdkI7OztFQUdFLHlCQUF5QjtFQUN6QixjQUFjO0VBQ2QscUJBQXFCLEVBQUE7O0FBRXZCOzs7RUFLRSwrQkFBK0IsRUFBQTs7QUFFakM7OztFQUdFLHlCQUF5QjtFQUN6QixjQUFjO0VBQ2QscUJBQXFCLEVBQUE7O0FBSXZCOzs7RUFHRSxjQUFjO0VBQ2QseUJBQXlCO0VBQ3pCLHFCQUFxQixFQUFBOztBQUV2Qjs7Ozs7RUFLRSx5QkFBeUI7RUFDekIsY0FBYztFQUNkLHFCQUFxQixFQUFBOztBQUV2Qjs7Ozs7RUFPRSwrQkFBK0IsRUFBQTs7QUFFakM7Ozs7O0VBS0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFJdkI7OztFQUdFLGNBQWM7RUFDZCxzQkFBc0I7RUFDdEIsa0JBQWtCLEVBQUE7O0FBRXBCOzs7OztFQUtFLHNCQUFzQjtFQUN0QixjQUFjO0VBQ2Qsa0JBQWtCLEVBQUE7O0FBRXBCOzs7OztFQU9FLCtCQUErQixFQUFBOztBQUVqQzs7Ozs7RUFLRSxzQkFBc0I7RUFDdEIsY0FBYztFQUNkLGtCQUFrQixFQUFBOztBQUlwQjs7O0VBR0UsY0FBYztFQUNkLHlCQUF5QjtFQUN6QixxQkFBcUIsRUFBQTs7QUFFdkI7Ozs7O0VBS0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFFdkI7Ozs7O0VBT0UsK0JBQStCLEVBQUE7O0FBRWpDOzs7OztFQUtFLHlCQUF5QjtFQUN6QixjQUFjO0VBQ2QscUJBQXFCLEVBQUE7O0FBSXZCOzs7RUFHRSxjQUFjO0VBQ2QseUJBQXlCO0VBQ3pCLHFCQUFxQixFQUFBOztBQUV2Qjs7Ozs7RUFLRSx5QkFBeUI7RUFDekIsY0FBYztFQUNkLHFCQUFxQixFQUFBOztBQUV2Qjs7Ozs7RUFPRSwrQkFBK0IsRUFBQTs7QUFFakM7Ozs7O0VBS0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFJdkI7OztFQUdFLGNBQWM7RUFDZCxzQkFBc0I7RUFDdEIsa0JBQWtCLEVBQUE7O0FBR3BCOztFQUVFLHFCQUFxQixFQUFBOztBQUd2Qjs7Ozs7RUFLRSxzQkFBc0I7RUFDdEIsY0FBYztFQUNkLGtCQUFrQixFQUFBOztBQUdwQjs7OztFQUlFLHFCQUFxQixFQUFBOztBQUd2Qjs7Ozs7RUFPRSwrQkFBK0IsRUFBQTs7QUFFakM7Ozs7O0VBS0Usc0JBQXNCO0VBQ3RCLGNBQWM7RUFDZCxrQkFBa0IsRUFBQTs7QUFHcEI7Ozs7RUFJRSxxQkFBcUIsRUFBQTs7QUFNdkI7O0VBRUUsOEJBQThCLEVBQUE7O0FBR2hDO0VBQ0UsbURBQW1ELEVBQUE7O0FBR3JEO0VBQ0UsMEJBQTBCLEVBQUE7O0FBRzVCO0VBQ0UsMEJBQTBCLEVBQUE7O0FBSTVCO0VBQ0UsWUFBWTtFQUNaLGdCQUFnQjtFQUNoQixVQUFVO0VBQ1YsY0FBYztFQUNkLFdBQVc7RUFFWCxpQkFBaUI7RUFHakIsY0FBYyxFQUFBOztBQUloQjtFQUNFLHdCQUF1QjtVQUF2Qix1QkFBdUIsRUFBQTs7QUFJekI7O0VBRUUscUJBQXFCLEVBQUE7O0FBSXZCOztFQUVFLDJCQUEyQixFQUFBOztBQUc3Qjs7Ozs7Ozs7Ozs7Ozs7RUFjRSwrQkFBK0IsRUFBQTs7QUFJakM7RUFDRSxxREFBcUQsRUFBQTs7QUFHdkQ7RUFDRSw2QkFBNkI7RUFDN0Isa0JBQWtCLEVBQUE7O0FBR3BCOzs7Ozs7Ozs7Ozs7O0VBYUUsZ0JBQWdCLEVBQUE7O0FBSWxCO0VBQ0UsV0FBVyxFQUFBOztBQUdiOztFQUVFLG1CQUFtQixFQUFBOztBQUtyQjtFQUNFLG1CQUFtQixFQUFBOztBQUdyQjs7RUFFRSxXQUFXLEVBQUE7O0FBSWI7RUFDRSx3QkFBd0IsRUFBQTs7QUFJMUI7RUFDRSxjQUFjLEVBQUE7O0FBR2hCO0VBQ0UsZUFBZSxFQUFBOztBQUdqQjtFQUNFLG1CQUFtQjtFQUNuQixlQUFlLEVBQUE7O0FBR2pCO0VBQ0UsZUFBZSxFQUFBOztBQU1qQixVQUFBOztBQUNBO0VBQ0UsV0FBVyxFQUFBOztBQUdiLFVBQUE7O0FBQ0E7RUFDRSxnQkFBZ0IsRUFBQTs7QUFHbEIsV0FBQTs7QUFDQTtFQUNFLHFCQUFxQjtFQUNyQixrQ0FBa0M7RUFDbEMsNEJBQTRCO0VBQzVCLGtCQUFrQixFQUFBOztBQUdwQixvQkFBQTs7QUFDQTtFQUNFLHFCQUFxQjtFQUNyQiw0QkFBNEIsRUFBQTs7QUMvbEI5QjtFQUNFLFFBQVE7RUFDUixVQUFVLEVBQUEiLCJmaWxlIjoic3JjL2FwcC9hcHAuY29tcG9uZW50LnNjc3MiLCJzb3VyY2VzQ29udGVudCI6WyIqIHtcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbn1cblxuYm9keSxcbmh0bWwge1xuICBmb250LWZhbWlseTogUm9ib3RvLCBcIkhlbHZldGljYSBOZXVlXCIsIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWYgIWltcG9ydGFudDtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBtYXJnaW46IDA7XG4gIHBhZGRpbmc6IDA7XG59XG5cbi5jMyB0ZXh0IHtcbiAgZm9udC1mYW1pbHk6IFJvYm90bywgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmICFpbXBvcnRhbnQ7XG4gIGZvbnQtc2l6ZTogMTRweDtcbn1cblxuaDEsXG4uaDEge1xuICBmb250LXNpemU6IDI0cHg7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG59XG5cbmgyLFxuLmgyIHtcbiAgZm9udC1zaXplOiAxOHB4O1xuICBmb250LXdlaWdodDogNTAwO1xufVxuXG5oMyxcbi5oMyB7XG59XG5cbnByZSB7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7XG4gIG92ZXJmbG93LXg6IGF1dG87XG4gIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbiAgd2hpdGUtc3BhY2U6IC1tb3otcHJlLXdyYXA7XG4gIHdoaXRlLXNwYWNlOiAtcHJlLXdyYXA7XG4gIHdoaXRlLXNwYWNlOiAtby1wcmUtd3JhcDtcbiAgd29yZC13cmFwOiBicmVhay13b3JkO1xufVxuXG4uZm9udC1pdGFsaWMtbGlnaHQge1xuICBmb250LXdlaWdodDogMTAwO1xuICBmb250LXN0eWxlOiBpdGFsaWM7XG59XG5cbi50ZXh0LW92ZXJmbG93LWVsbGlwc2lzIHtcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG59XG5cbi5sYWJlbCxcbmxhYmVsIHtcbiAgZGlzcGxheTogYmxvY2s7XG4gIG1hcmdpbi1ib3R0b206IDEwcHg7XG4gIG1hcmdpbi10b3A6IDIwcHg7XG59XG5cbi5iYWRnZSA+IC5waSB7XG4gIHBhZGRpbmctcmlnaHQ6IDRweDtcbn1cblxuYS5pY29uLWxpbms6bGFzdC1vZi10eXBlIHtcbiAgcGFkZGluZy1yaWdodDogMTBweDtcbn1cblxuYS5pY29uLWxpbms6Zmlyc3Qtb2YtdHlwZSB7XG4gIHBhZGRpbmctbGVmdDogMTBweDtcbn1cblxuYS5pY29uLWxpbmsge1xuICBmb250LXNpemU6IDAuODVlbTtcbiAgcGFkZGluZzogMCA1cHg7XG59XG5cbmJvZHkgLnVpLXdpZGdldC1vdmVybGF5IHtcbiAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAwLCAwLCAwLjIpO1xuICB0cmFuc2l0aW9uOiBhbGwgbGluZWFyIDAuMnM7XG59XG5cbi51aS1zdGF0ZS1oaWdobGlnaHQgYS5pY29uLWxpbmsge1xuICBjb2xvcjogI2ZmZmZmZjtcbn1cblxuLnVpLXN0YXRlLWhpZ2hsaWdodCBhLmljb24tbGluazpob3ZlciB7XG4gIGNvbG9yOiAjZmZmZmZmYmE7XG59XG5cbi5lbXB0eS1wbGFjZWhvbGRlciB7XG4gIGNvbG9yOiAjOTk5O1xuICBmb250LXdlaWdodDogMTAwO1xuICBwYWRkaW5nOiAyMHB4IDA7XG4gIC8qIGhlaWdodDogMTAwJTsgKi9cbiAgdGV4dC1hbGlnbjogY2VudGVyO1xufVxuXG4udWktdG9hc3Qge1xuICBtYXgtaGVpZ2h0OiAxMDB2aDtcbiAgb3ZlcmZsb3cteTogYXV0bztcbn1cblxuLnVpLXRvYXN0LWRldGFpbCB7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7XG59XG5cbi5tb2RhbC1kaWFsb2cudWktZGlhbG9nIHtcbiAgd2lkdGg6IDQwMHB4O1xufVxuXG4vLyBBZGQgYm90dG9tIG1hcmdpbiB0byByb3dzIGluIGRpYWxvZ3Ncbi51aS1kaWFsb2cgLnVpLWdyaWQgLnVpLWdyaWQtcm93IHtcbiAgbWFyZ2luLWJvdHRvbTogMTBweDtcbn1cblxuLnVpLWRpYWxvZyAudWktbGlzdGJveCAudWktbGlzdGJveC1saXN0LXdyYXBwZXIge1xuICBtYXgtaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNDAwcHgpO1xuICBtaW4taGVpZ2h0OiAxMDBweDtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctY29udGVudCB7XG4gIG1heC1oZWlnaHQ6IGNhbGMoMTAwdmggLSAyMDBweCk7XG4gIG1pbi1oZWlnaHQ6IDIwMHB4O1xuICBvdmVyZmxvdy15OiBhdXRvO1xuICBvdmVyZmxvdy15OiBvdmVybGF5O1xuXG4gIC1tcy1vdmVyZmxvdy1zdHlsZTogLW1zLWF1dG9oaWRpbmctc2Nyb2xsYmFyO1xuXG4gIGJvcmRlci1sZWZ0OiBub25lO1xuICBib3JkZXItcmlnaHQ6IG5vbmU7XG59XG5cbmJvZHkgLnVpLWRpYWxvZyAudWktZGlhbG9nLXRpdGxlYmFyLFxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctZm9vdGVyIHtcbiAgYm9yZGVyLWxlZnQ6IG5vbmU7XG4gIGJvcmRlci1yaWdodDogbm9uZTtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXIge1xuICBib3JkZXItdG9wOiBub25lO1xufVxuXG5ib2R5IC51aS1kaWFsb2cgLnVpLWRpYWxvZy1mb290ZXIge1xuICBib3JkZXItYm90dG9tOiBub25lO1xufVxuXG4udWktZGlhbG9nIC51aS1saXN0Ym94IC51aS1wcm9ncmVzc2JhciB7XG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTRweDtcbiAgbWFyZ2luLXRvcDogM3B4O1xuICBtYXJnaW4tYm90dG9tOiAtM3B4O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwMDAwNGE7XG59XG5cbi8vIFByb2dyZXNzIGJhciBpbiBsaXN0Ym94IGluIGRpYWxvZ3Ncbi51aS1kaWFsb2cgLnVpLWxpc3Rib3ggLnVpLXByb2dyZXNzYmFyIC51aS1wcm9ncmVzc2Jhci1sYWJlbCB7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgbGluZS1oZWlnaHQ6IDEuMjU7XG4gIGNvbG9yOiBpbmhlcml0O1xufVxuXG4udWktZGlhbG9nIC51aS1saXN0Ym94IC51aS1wcm9ncmVzc2JhciAudWktcHJvZ3Jlc3NiYXItdmFsdWUge1xuICBiYWNrZ3JvdW5kOiAjMDAwMDAwNmI7XG59XG5cbi8vIE92ZXJ3cml0ZSBQcmltZU5HIGZvbnRzXG5ib2R5IC51aS13aWRnZXQsXG5ib2R5XG4gIC51aS1hdXRvY29tcGxldGUudWktYXV0b2NvbXBsZXRlLW11bHRpcGxlXG4gIC51aS1hdXRvY29tcGxldGUtbXVsdGlwbGUtY29udGFpbmVyXG4gIC51aS1hdXRvY29tcGxldGUtaW5wdXQtdG9rZW5cbiAgaW5wdXQsXG5ib2R5IC51aS1jaGlwcyA+IHVsLnVpLWlucHV0dGV4dCAudWktY2hpcHMtaW5wdXQtdG9rZW4gaW5wdXQsXG5ib2R5IC51aS10YWJsZSAudWktZWRpdGFibGUtY29sdW1uIGlucHV0LFxuYm9keSAudWktdHJlZXRhYmxlIC51aS1lZGl0YWJsZS1jb2x1bW4gaW5wdXQsXG5ib2R5IC51aS10ZXJtaW5hbCAudWktdGVybWluYWwtaW5wdXQge1xuICBmb250LWZhbWlseTogUm9ib3RvLCBcIkhlbHZldGljYSBOZXVlXCIsIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWYgIWltcG9ydGFudDtcbn1cblxuLy8gT3ZlcndyaXRlIFByaW1lTmcgY29sb3Vyc1xuYm9keSAuc2Vjb25kYXJ5LWNvbCxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zZWNvbmRhcnksXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLXNlY29uZGFyeSA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdCB7XG4gIGNvbG9yOiAjMzMzMzMzO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZThlOGU4O1xuICBib3JkZXItY29sb3I6ICNlOGU4ZTg7XG59XG5ib2R5IC5zZWNvbmRhcnktY29sOmhvdmVyLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXNlY29uZGFyeTplbmFibGVkOmhvdmVyLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zZWNvbmRhcnlcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNjOGM4Yzg7XG4gIGNvbG9yOiAjMzMzMzMzO1xuICBib3JkZXItY29sb3I6ICNjOGM4Yzg7XG59XG4vLyBDb2xvdXJzIGZyb20gUHJpbWVOR1xuYm9keSAuc2Vjb25kYXJ5LWNvbDplbmFibGVkOmZvY3VzLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXNlY29uZGFyeTplbmFibGVkOmZvY3VzLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zZWNvbmRhcnlcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpmb2N1cyB7XG4gIC13ZWJraXQtYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gIzhkY2RmZjtcbiAgLW1vei1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjOGRjZGZmO1xuICBib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjOGRjZGZmO1xufVxuYm9keSAuc2Vjb25kYXJ5LWNvbDphY3RpdmUsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc2Vjb25kYXJ5OmVuYWJsZWQ6YWN0aXZlLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zZWNvbmRhcnlcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjYTBhMGEwO1xuICBjb2xvcjogIzMzMzMzMztcbiAgYm9yZGVyLWNvbG9yOiAjYTBhMGEwO1xufVxuYm9keSAuZGVmYXVsdC1jb2wsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24taW5mbyxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24taW5mbyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdCB7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3YWQ5O1xuICBib3JkZXItY29sb3I6ICMwMDdhZDk7XG59XG5ib2R5IC5kZWZhdWx0LWNvbDpob3ZlcixcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1pbmZvOmVuYWJsZWQ6aG92ZXIsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWluZm8gPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICMxMTZmYmY7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBib3JkZXItY29sb3I6ICMxMTZmYmY7XG59XG5ib2R5IC5kZWZhdWx0LWNvbDplbmFibGVkOmZvY3VzLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWluZm86ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24taW5mbyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjOGRjZGZmO1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICM4ZGNkZmY7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICM4ZGNkZmY7XG59XG5ib2R5IC5kZWZhdWx0LWNvbDphY3RpdmUsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24taW5mbzplbmFibGVkOmFjdGl2ZSxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24taW5mbyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmFjdGl2ZSB7XG4gIGJhY2tncm91bmQtY29sb3I6ICMwMDViOWY7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBib3JkZXItY29sb3I6ICMwMDViOWY7XG59XG5cbi8vIFNVY2Nlc3MgY29sXG5ib2R5IC5zdWNjZXNzLWNvbCxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zdWNjZXNzLFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zdWNjZXNzID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0IHtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJhY2tncm91bmQtY29sb3I6ICMzNGE4MzU7XG4gIGJvcmRlci1jb2xvcjogIzM0YTgzNTtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sOmhvdmVyLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3M6ZW5hYmxlZDpob3ZlcixcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2Vzc1xuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzEwN2QxMTtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogIzEwN2QxMTtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc3VjY2VzczplbmFibGVkOmZvY3VzLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zdWNjZXNzXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6Zm9jdXMge1xuICAtd2Via2l0LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNhYWU1YWE7XG4gIC1tb3otYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2FhZTVhYTtcbiAgYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2FhZTVhYTtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sOmFjdGl2ZSxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zdWNjZXNzOmVuYWJsZWQ6YWN0aXZlLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zdWNjZXNzXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6YWN0aXZlIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzBjNmIwZDtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogIzBjNmIwZDtcbn1cblxuLy8gU1VjY2VzcyBvdXRsaW5lXG5ib2R5IC5zdWNjZXNzLWNvbC1vdXRsaW5lLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZSxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0IHtcbiAgY29sb3I6ICMzNGE4MzU7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGJvcmRlci1jb2xvcjogI2ZmZjtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sLW91dGxpbmU6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lOmVuYWJsZWQ6aG92ZXIsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZVxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgY29sb3I6ICMxMDdkMTE7XG4gIGJvcmRlci1jb2xvcjogI2ZmZjtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sLW91dGxpbmU6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zdWNjZXNzLW91dGxpbmU6ZW5hYmxlZDpmb2N1cyxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6Zm9jdXMge1xuICAtd2Via2l0LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNhYWU1YWE7XG4gIC1tb3otYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2FhZTVhYTtcbiAgYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2FhZTVhYTtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sLW91dGxpbmU6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZTplbmFibGVkOmFjdGl2ZSxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6YWN0aXZlIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgY29sb3I6ICMwYzZiMGQ7XG4gIGJvcmRlci1jb2xvcjogI2ZmZjtcbn1cblxuLy8gV2FybmluZyBjb2xcbmJvZHkgLndhcm5pbmctY29sLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXdhcm5pbmcsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLXdhcm5pbmcgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogIzMzMzMzMztcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmYmEwMTtcbiAgYm9yZGVyLWNvbG9yOiAjZmZiYTAxO1xufVxuYm9keSAud2FybmluZy1jb2w6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24td2FybmluZzplbmFibGVkOmhvdmVyLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi13YXJuaW5nXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZWQ5OTBiO1xuICBjb2xvcjogIzMzMzMzMztcbiAgYm9yZGVyLWNvbG9yOiAjZWQ5OTBiO1xufVxuYm9keSAud2FybmluZy1jb2w6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi13YXJuaW5nOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLXdhcm5pbmdcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpmb2N1cyB7XG4gIC13ZWJraXQtYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2ZmZWFiNDtcbiAgLW1vei1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZmZlYWI0O1xuICBib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZmZlYWI0O1xufVxuYm9keSAud2FybmluZy1jb2w6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXdhcm5pbmc6ZW5hYmxlZDphY3RpdmUsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLXdhcm5pbmdcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZDM4YjEwO1xuICBjb2xvcjogIzMzMzMzMztcbiAgYm9yZGVyLWNvbG9yOiAjZDM4YjEwO1xufVxuXG4vLyBEYW5nZXIgY29sb3VyXG5ib2R5IC5kYW5nZXItY29sLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlcixcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0IHtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJhY2tncm91bmQtY29sb3I6ICNlOTEyMjQ7XG4gIGJvcmRlci1jb2xvcjogI2U5MTIyNDtcbn1cbmJvZHkgLmRhbmdlci1jb2w6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyOmVuYWJsZWQ6aG92ZXIsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlclxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2MwMTEyMDtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogI2MwMTEyMDtcbn1cbmJvZHkgLmRhbmdlci1jb2w6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXI6ZW5hYmxlZDpmb2N1cyxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6Zm9jdXMge1xuICAtd2Via2l0LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7XG4gIC1tb3otYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2Y5YjRiYTtcbiAgYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2Y5YjRiYTtcbn1cbmJvZHkgLmRhbmdlci1jb2w6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlcjplbmFibGVkOmFjdGl2ZSxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6YWN0aXZlIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2E5MDAwMDtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogI2E5MDAwMDtcbn1cblxuLy8gRGFuZ2VyIG91dGxpbmVcbmJvZHkgLmRhbmdlci1jb2wtb3V0bGluZSxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZSxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmUgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogI2U5MTIyNDtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgYm9yZGVyLWNvbG9yOiAjZmZmO1xufVxuXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmUsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0IHtcbiAgYm9yZGVyLWNvbG9yOiAjZTkxMjI0O1xufVxuXG5ib2R5IC5kYW5nZXItY29sLW91dGxpbmU6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmU6ZW5hYmxlZDpob3ZlcixcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmVcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGNvbG9yOiAjYzAxMTIwO1xuICBib3JkZXItY29sb3I6ICNmZmY7XG59XG5cbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZTplbmFibGVkOmhvdmVyLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZVxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYm9yZGVyLWNvbG9yOiAjYzAxMTIwO1xufVxuXG5ib2R5IC5kYW5nZXItY29sLW91dGxpbmU6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZTplbmFibGVkOmZvY3VzLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZVxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZjliNGJhO1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7XG59XG5ib2R5IC5kYW5nZXItY29sLW91dGxpbmU6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lOmVuYWJsZWQ6YWN0aXZlLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZVxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmFjdGl2ZSB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGNvbG9yOiAjYTkwMDAwO1xuICBib3JkZXItY29sb3I6ICNmZmY7XG59XG5cbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZTplbmFibGVkOmFjdGl2ZSxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmVcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBib3JkZXItY29sb3I6ICNhOTAwMDA7XG59XG5cbi8vIE92ZXJyaWRpbmcgb3RoZXIgUHJpbWVORyBzdHlsZXNcblxuLy8gTW92aW5nIG1hcmdpbiB0byBsZWZ0IHNpZGUgLSBmcm9tIHJpZ2h0IGZvciBidXR0b25zIGluIGRpYWxvZy9jYXJkIGZvb3RlcnNcbmJvZHkgLnVpLWRpYWxvZyAudWktZGlhbG9nLWZvb3RlciBidXR0b24sXG5ib2R5IC51aS1jYXJkIC51aS1jYXJkLWZvb3RlciBidXR0b24ge1xuICBtYXJnaW46IDAgMCAwIDAuNWVtICFpbXBvcnRhbnQ7XG59XG5cbmJvZHkgLnVpLWRpYWxvZyB7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDJweCByZ2JhKDAsIDAsIDAsIDAuMSkgIWltcG9ydGFudDtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXIge1xuICBib3JkZXItcmFkaXVzOiA0cHggNHB4IDAgMDtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctZm9vdGVyIHtcbiAgYm9yZGVyLXJhZGl1czogMCAwIDRweCA0cHg7XG59XG5cbi8vIE1ha2UgdWkgZXJyb3IgbWVzc2FnZXMgbW9yZSBhdHRyYWN0aXZlXG5ib2R5IC51aS1tZXNzYWdlcy1lcnJvciB7XG4gIGJvcmRlcjogbm9uZTtcbiAgZm9udC13ZWlnaHQ6IDgwMDtcbiAgcGFkZGluZzogMDtcbiAgZGlzcGxheTogYmxvY2s7XG4gIHdpZHRoOiAxMDAlO1xuXG4gIHRleHQtYWxpZ246IHJpZ2h0O1xuXG4gIC8vIEZyb20gLnVpLWlucHV0dGV4dC5uZy1kaXJ0eS5uZy1pbnZhbGlkXG4gIGNvbG9yOiAjYTgwMDAwO1xufVxuXG4vLyBSZW1vdmUgbGVmdCBwYWRkaW5nIGZyb20gZXJyb3IgbWVzc2FnZXMgVUxcbmJvZHkgLm5nLWRpcnR5Lm5nLWludmFsaWQgKyB1bCB7XG4gIHBhZGRpbmctaW5saW5lLXN0YXJ0OiAwO1xufVxuXG4vLyBNYWtlIGludmFsaWQgaW5wdXQgYm9yZGVyIHJlZCAtIGV2ZW4gd2hlbiBmb2N1c3NlZFxuYm9keSAudWktaW5wdXR0ZXh0Lm5nLWludmFsaWQ6ZW5hYmxlZDpmb2N1cyxcbi51aS1pbnB1dHRleHQge1xuICBib3JkZXItY29sb3I6ICNhODAwMDA7XG59XG5cbi8vIEFkZCBsaWdodCByZWQgb3V0bGluZSB0byBpbnZhbGlkIHRleHQgaW5wdXRzXG5ib2R5IC51aS1pbnB1dHRleHQsXG5ib2R5IC51aS1pbnB1dGdyb3VwIC51aS1pbnB1dHRleHQubmctZGlydHkubmctaW52YWxpZCArIC51aS1pbnB1dGdyb3VwLWFkZG9uIHtcbiAgdHJhbnNpdGlvbjogYm94LXNoYWRvdyAwLjJzO1xufVxuXG5ib2R5IC51aS1pbnB1dHRleHQubmctZGlydHkubmctaW52YWxpZCxcbmJvZHkgcC1kcm9wZG93bi5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLWRyb3Bkb3duLFxuYm9keSBwLWF1dG9jb21wbGV0ZS5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLWF1dG9jb21wbGV0ZSA+IC51aS1pbnB1dHRleHQsXG5ib2R5IHAtY2FsZW5kYXIubmctZGlydHkubmctaW52YWxpZCA+IC51aS1jYWxlbmRhciA+IC51aS1pbnB1dHRleHQsXG5ib2R5IHAtY2hpcHMubmctZGlydHkubmctaW52YWxpZCA+IC51aS1pbnB1dHRleHQsXG5ib2R5IHAtaW5wdXRtYXNrLm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktaW5wdXR0ZXh0LFxuYm9keSBwLWNoZWNrYm94Lm5nLWRpcnR5Lm5nLWludmFsaWQgLnVpLWNoa2JveC1ib3gsXG5ib2R5IHAtcmFkaW9idXR0b24ubmctZGlydHkubmctaW52YWxpZCAudWktcmFkaW9idXR0b24tYm94LFxuYm9keSBwLWlucHV0c3dpdGNoLm5nLWRpcnR5Lm5nLWludmFsaWQgLnVpLWlucHV0c3dpdGNoLFxuYm9keSBwLWxpc3Rib3gubmctZGlydHkubmctaW52YWxpZCAudWktaW5wdXR0ZXh0LFxuYm9keSBwLW11bHRpc2VsZWN0Lm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktbXVsdGlzZWxlY3QsXG5ib2R5IHAtc3Bpbm5lci5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLWlucHV0dGV4dCxcbmJvZHkgcC1zZWxlY3RidXR0b24ubmctZGlydHkubmctaW52YWxpZCAudWktYnV0dG9uLFxuYm9keSBwLXRvZ2dsZWJ1dHRvbi5uZy1kaXJ0eS5uZy1pbnZhbGlkIC51aS1idXR0b24ge1xuICBib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZjliNGJhO1xufVxuXG4vLyBFeHRlbmQgdGV4dC1maWVsZCByZWQgb3V0bGluZSB0byBhZGphY2VudCBsYWJlbHMgYW5kIGJ1dHRvbnNcbmJvZHkgLnVpLWlucHV0Z3JvdXAgLnVpLWlucHV0dGV4dC5uZy1kaXJ0eS5uZy1pbnZhbGlkICsgLnVpLWlucHV0Z3JvdXAtYWRkb24ge1xuICBib3gtc2hhZG93OiAycHggLTIuOHB4IDAgI2Y5YjRiYSwgMnB4IDIuOHB4IDAgI2Y5YjRiYTtcbn1cblxuYm9keSBwLWNhbGVuZGFyLm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktY2FsZW5kYXIudWktY2FsZW5kYXItdy1idG4ge1xuICBib3gtc2hhZG93OiAwIDAgMCAzcHggI2Y5YjRiYTtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xufVxuXG5ib2R5XG4gIC51aS1pbnB1dGdyb3VwXG4gIC51aS1pbnB1dHRleHQ6ZW5hYmxlZDpmb2N1czpub3QoLnVpLXN0YXRlLWVycm9yKVxuICArIC51aS1pbnB1dGdyb3VwLWFkZG9uLFxuYm9keVxuICBwLWNhbGVuZGFyLm5nLWRpcnR5Lm5nLWludmFsaWRcbiAgPiAudWktY2FsZW5kYXJcbiAgPiAudWktaW5wdXR0ZXh0OmVuYWJsZWQ6Zm9jdXM6bm90KC51aS1zdGF0ZS1lcnJvciksXG5ib2R5XG4gIHAtY2FsZW5kYXIubmctZGlydHkubmctaW52YWxpZFxuICA+IC51aS1jYWxlbmRhclxuICA+IC51aS1pbnB1dHRleHQ6ZW5hYmxlZDpmb2N1czpub3QoLnVpLXN0YXRlLWVycm9yKVxuICArIC51aS1jYWxlbmRhci1idXR0b24ge1xuICBib3gtc2hhZG93OiBub25lO1xufVxuXG4vLyBGb3JjZSAxMDAlIHdpZHRoIG9uIHVpLXRleHQtaW5wdXRzXG4qOm5vdCgudWktY2FsZW5kYXIpIC51aS1pbnB1dHRleHQge1xuICB3aWR0aDogMTAwJTtcbn1cblxuYm9keSAudWktc3RhdGUtZGlzYWJsZWQsXG5ib2R5IC51aS13aWRnZXQ6ZGlzYWJsZWQge1xuICBjdXJzb3I6IG5vdC1hbGxvd2VkO1xufVxuXG4vLyBTdHlsZXMgZm9yIEZvcm1zXG5cbi5mb3JtIGR5bmFtaWMtcHJpbWVuZy1mb3JtLWNvbnRyb2wgPiBkaXYge1xuICBtYXJnaW4tYm90dG9tOiAxMHB4O1xufVxuXG4uZm9ybSAudWktY2FsZW5kYXIsXG4uZm9ybSAudWktc3Bpbm5lciB7XG4gIHdpZHRoOiAxMDAlO1xufVxuXG4vLyBNYWtlIHByaW1lbmcgY2FsZW5kYXIgaW5wdXQgdGV4dGJveGVzIHRoZSBmdWxsIHdpZHRoIG9mIHRoZSBwb3B1cFxuLmZvcm0gLnVpLWNhbGVuZGFyLXctYnRuIGlucHV0LnVpLWlucHV0dGV4dCB7XG4gIHdpZHRoOiBjYWxjKDEwMCUgLSAzM3B4KTtcbn1cblxuLy8gTWFrZSBEYXRlcGlja2VyIGluIHBvcHVwcyBhIGJpdCBzbWFsbGVyXG4uZm9ybSAudWktZGF0ZXBpY2tlciB7XG4gIHBhZGRpbmc6IDAuNWVtO1xufVxuXG4uZm9ybSAudWktZGF0ZXBpY2tlciB7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cblxuLmZvcm0gLnVpLWRhdGVwaWNrZXIgLnVpLXRpbWVwaWNrZXIge1xuICBwYWRkaW5nOiAxMHB4IDAgMCAwO1xuICBmb250LXNpemU6IDExcHg7XG59XG5cbi5mb3JtIC51aS1kYXRlcGlja2VyIHRhYmxlIHtcbiAgZm9udC1zaXplOiAxMXB4O1xufVxuXG4vLyBTY3JvbGxiYXIgc3R5bGVcblxuLy8gU2Nyb2xsYmFyIGFkYXB0ZWQgZnJvbSBodHRwczovL3d3dy53M3NjaG9vbHMuY29tL2hvd3RvL2hvd3RvX2Nzc19jdXN0b21fc2Nyb2xsYmFyLmFzcFxuLyogd2lkdGggKi9cbjo6LXdlYmtpdC1zY3JvbGxiYXIge1xuICB3aWR0aDogMTBweDtcbn1cblxuLyogVHJhY2sgKi9cbjo6LXdlYmtpdC1zY3JvbGxiYXItdHJhY2sge1xuICBiYWNrZ3JvdW5kOiBub25lO1xufVxuXG4vKiBIYW5kbGUgKi9cbjo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWIge1xuICBiYWNrZ3JvdW5kOiAjMDAwMDAwMzM7XG4gIGJvcmRlcjogMnB4IHNvbGlkIHJnYmEoMCwgMCwgMCwgMCk7XG4gIGJhY2tncm91bmQtY2xpcDogcGFkZGluZy1ib3g7XG4gIGJvcmRlci1yYWRpdXM6IDVweDtcbn1cblxuLyogSGFuZGxlIG9uIGhvdmVyICovXG46Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1iOmhvdmVyIHtcbiAgYmFja2dyb3VuZDogIzAwMDAwMDU1O1xuICBiYWNrZ3JvdW5kLWNsaXA6IHBhZGRpbmctYm94O1xufVxuIiwiQGltcG9ydCBcIi4uL3N0eWxlcy5zY3NzXCI7XG5cbi8vIE92ZXJ3cml0ZSB0b2FzdCB0b3AtcmlnaHQgc28gaXQgbGluZXMgdXAgd2l0aCBtYXBib3ggY29udHJvbHNcbi51aS10b2FzdC10b3AtcmlnaHQge1xuICB0b3A6IDhweDtcbiAgcmlnaHQ6IDhweDtcbn1cbiJdfQ== */"

/***/ }),

/***/ "./src/app/app.component.ts":
/*!**********************************!*\
  !*** ./src/app/app.component.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const api_1 = __webpack_require__(/*! primeng/api */ "./node_modules/primeng/api.js");
const flash_message_service_1 = __webpack_require__(/*! ./services/flash-message.service */ "./src/app/services/flash-message.service.ts");
/**
 * Root app component - contains router-outlet
 *
 * @export
 * @class AppComponent
 */
let AppComponent = class AppComponent {
    constructor(messageService, flashMessageService) {
        this.messageService = messageService;
        this.flashMessageService = flashMessageService;
        // Display error messages on update
        this.errorMessageSubscription = this.flashMessageService
            .getFlashMessageObservable()
            .subscribe(errorMessage => this.messageService.add({
            life: errorMessage.duration,
            severity: errorMessage.severity,
            summary: errorMessage.title,
            detail: errorMessage.message,
            sticky: errorMessage.sticky,
        }));
    }
    ngOnDestroy() {
        this.errorMessageSubscription.unsubscribe();
        this.messageService.clear();
    }
};
AppComponent = __decorate([
    core_1.Component({
        selector: "app-root",
        template: __webpack_require__(/*! ./app.component.html */ "./src/app/app.component.html"),
        providers: [api_1.MessageService],
        styles: [__webpack_require__(/*! ./app.component.scss */ "./src/app/app.component.scss")]
    }),
    __metadata("design:paramtypes", [api_1.MessageService,
        flash_message_service_1.FlashMessageService])
], AppComponent);
exports.AppComponent = AppComponent;


/***/ }),

/***/ "./src/app/app.module.ts":
/*!*******************************!*\
  !*** ./src/app/app.module.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const platform_browser_1 = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/fesm2015/platform-browser.js");
const animations_1 = __webpack_require__(/*! @angular/platform-browser/animations */ "./node_modules/@angular/platform-browser/fesm2015/animations.js");
const angular_jwt_1 = __webpack_require__(/*! @auth0/angular-jwt */ "./node_modules/@auth0/angular-jwt/index.js");
const http_1 = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm2015/http.js");
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const forms_1 = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm2015/forms.js");
const core_2 = __webpack_require__(/*! @ng-dynamic-forms/core */ "./node_modules/@ng-dynamic-forms/core/fesm2015/core.js");
const ui_primeng_1 = __webpack_require__(/*! @ng-dynamic-forms/ui-primeng */ "./node_modules/@ng-dynamic-forms/ui-primeng/fesm2015/ui-primeng.js");
const ngx_file_drop_1 = __webpack_require__(/*! ngx-file-drop */ "./node_modules/ngx-file-drop/fesm2015/ngx-file-drop.js");
// Font awesome
const angular_fontawesome_1 = __webpack_require__(/*! @fortawesome/angular-fontawesome */ "./node_modules/@fortawesome/angular-fontawesome/fesm2015/angular-fontawesome.js");
const fontawesome_svg_core_1 = __webpack_require__(/*! @fortawesome/fontawesome-svg-core */ "./node_modules/@fortawesome/fontawesome-svg-core/index.es.js");
const free_solid_svg_icons_1 = __webpack_require__(/*! @fortawesome/free-solid-svg-icons */ "./node_modules/@fortawesome/free-solid-svg-icons/index.es.js");
fontawesome_svg_core_1.library.add(free_solid_svg_icons_1.faEye, free_solid_svg_icons_1.faEyeSlash, free_solid_svg_icons_1.faFire, free_solid_svg_icons_1.faMapMarker, free_solid_svg_icons_1.faDrawPolygon, free_solid_svg_icons_1.faCrop, free_solid_svg_icons_1.faClock, free_solid_svg_icons_1.faCog, free_solid_svg_icons_1.faLayerGroup, free_solid_svg_icons_1.faPlay, free_solid_svg_icons_1.faStop, free_solid_svg_icons_1.faPause, free_solid_svg_icons_1.faTerminal, free_solid_svg_icons_1.faCaretUp, free_solid_svg_icons_1.faMinus, free_solid_svg_icons_1.faPlus, free_solid_svg_icons_1.faPlusCircle, free_solid_svg_icons_1.faTimes, free_solid_svg_icons_1.faTimesCircle, free_solid_svg_icons_1.faSearch, free_solid_svg_icons_1.faCrosshairs, free_solid_svg_icons_1.faBars, free_solid_svg_icons_1.faRuler, free_solid_svg_icons_1.faMapPin, free_solid_svg_icons_1.faShapes, free_solid_svg_icons_1.faSync, free_solid_svg_icons_1.faTrash, free_solid_svg_icons_1.faUsers, free_solid_svg_icons_1.faInfoCircle, free_solid_svg_icons_1.faGlobeAsia, free_solid_svg_icons_1.faPoll, free_solid_svg_icons_1.faFolderOpen, free_solid_svg_icons_1.faPen);
// PrimeNg
const slider_1 = __webpack_require__(/*! primeng/slider */ "./node_modules/primeng/slider.js");
const tooltip_1 = __webpack_require__(/*! primeng/tooltip */ "./node_modules/primeng/tooltip.js");
const inputtext_1 = __webpack_require__(/*! primeng/inputtext */ "./node_modules/primeng/inputtext.js");
const sidebar_1 = __webpack_require__(/*! primeng/sidebar */ "./node_modules/primeng/sidebar.js");
const button_1 = __webpack_require__(/*! primeng/button */ "./node_modules/primeng/button.js");
const orderlist_1 = __webpack_require__(/*! primeng/orderlist */ "./node_modules/primeng/orderlist.js");
const colorpicker_1 = __webpack_require__(/*! primeng/colorpicker */ "./node_modules/primeng/colorpicker.js");
const dropdown_1 = __webpack_require__(/*! primeng/dropdown */ "./node_modules/primeng/dropdown.js");
const calendar_1 = __webpack_require__(/*! primeng/calendar */ "./node_modules/primeng/calendar.js");
const toast_1 = __webpack_require__(/*! primeng/toast */ "./node_modules/primeng/toast.js");
const overlaypanel_1 = __webpack_require__(/*! primeng/overlaypanel */ "./node_modules/primeng/overlaypanel.js");
const card_1 = __webpack_require__(/*! primeng/card */ "./node_modules/primeng/card.js");
const listbox_1 = __webpack_require__(/*! primeng/listbox */ "./node_modules/primeng/listbox.js");
const primeng_1 = __webpack_require__(/*! primeng/primeng */ "./node_modules/primeng/primeng.js");
const togglebutton_1 = __webpack_require__(/*! primeng/togglebutton */ "./node_modules/primeng/togglebutton.js");
const slidemenu_1 = __webpack_require__(/*! primeng/slidemenu */ "./node_modules/primeng/slidemenu.js");
const dialog_1 = __webpack_require__(/*! primeng/dialog */ "./node_modules/primeng/dialog.js");
const panel_1 = __webpack_require__(/*! primeng/panel */ "./node_modules/primeng/panel.js");
const tree_1 = __webpack_require__(/*! primeng/tree */ "./node_modules/primeng/tree.js");
const spinner_1 = __webpack_require__(/*! primeng/spinner */ "./node_modules/primeng/spinner.js");
// Module Imports
const app_routing_module_1 = __webpack_require__(/*! ./app-routing.module */ "./src/app/app-routing.module.ts");
const app_component_1 = __webpack_require__(/*! ./app.component */ "./src/app/app.component.ts");
const geoweb_component_1 = __webpack_require__(/*! ./geo-web/geoweb.component */ "./src/app/geo-web/geoweb.component.ts");
const home_component_1 = __webpack_require__(/*! ./home/home.component */ "./src/app/home/home.component.ts");
const map_component_1 = __webpack_require__(/*! ./geo-web/map/map.component */ "./src/app/geo-web/map/map.component.ts");
const map_popup_component_1 = __webpack_require__(/*! ./geo-web/map/map-popup/map-popup-component */ "./src/app/geo-web/map/map-popup/map-popup-component.ts");
const callback_pipe_1 = __webpack_require__(/*! ./util/callback.pipe */ "./src/app/util/callback.pipe.ts");
const disclaimer_component_1 = __webpack_require__(/*! ./disclaimer/disclaimer.component */ "./src/app/disclaimer/disclaimer.component.ts");
const form_validators_1 = __webpack_require__(/*! ./util/form-validators */ "./src/app/util/form-validators.ts");
const spinner_component_1 = __webpack_require__(/*! ./spinner/spinner.component */ "./src/app/spinner/spinner.component.ts");
const form_component_1 = __webpack_require__(/*! ./form/form.component */ "./src/app/form/form.component.ts");
const login_component_1 = __webpack_require__(/*! ./login/login.component */ "./src/app/login/login.component.ts");
const auth_service_1 = __webpack_require__(/*! ./services/auth.service */ "./src/app/services/auth.service.ts");
const form_instance_component_1 = __webpack_require__(/*! ./form/form-instance.component */ "./src/app/form/form-instance.component.ts");
const file_drop_upload_component_1 = __webpack_require__(/*! ./file-drop-upload/file-drop-upload.component */ "./src/app/file-drop-upload/file-drop-upload.component.ts");
const form_monaco_editor_component_1 = __webpack_require__(/*! ./form/monaco-editor/form-monaco-editor.component */ "./src/app/form/monaco-editor/form-monaco-editor.component.ts");
const code_editor_model_1 = __webpack_require__(/*! ./form/monaco-editor/code-editor-model */ "./src/app/form/monaco-editor/code-editor-model.ts");
const ngx_monaco_editor_1 = __webpack_require__(/*! ngx-monaco-editor */ "./node_modules/ngx-monaco-editor/fesm2015/ngx-monaco-editor.js");
const file_browser_component_1 = __webpack_require__(/*! ./file-browser/file-browser.component */ "./src/app/file-browser/file-browser.component.ts");
const form_file_browser_input_component_1 = __webpack_require__(/*! ./form/file-browser-input/form-file-browser-input.component */ "./src/app/form/file-browser-input/form-file-browser-input.component.ts");
const file_browser_input_model_1 = __webpack_require__(/*! ./form/file-browser-input/file-browser-input-model */ "./src/app/form/file-browser-input/file-browser-input-model.ts");
const file_browser_input_component_1 = __webpack_require__(/*! ./form/file-browser-input/file-browser-input.component */ "./src/app/form/file-browser-input/file-browser-input.component.ts");
const form_mutable_array_component_1 = __webpack_require__(/*! ./form/form-mutable-array/form-mutable-array.component */ "./src/app/form/form-mutable-array/form-mutable-array.component.ts");
const electron_service_1 = __webpack_require__(/*! ./services/electron.service */ "./src/app/services/electron.service.ts");
const config_service_1 = __webpack_require__(/*! ./services/config.service */ "./src/app/services/config.service.ts");
function initialiseApp(configService) {
    return () => {
        return configService.init();
    };
}
exports.initialiseApp = initialiseApp;
let AppModule = class AppModule {
    constructor(injector) {
        this.injector = injector;
        exports.InjectorInstance = this.injector;
    }
};
AppModule = __decorate([
    core_1.NgModule({
        declarations: [
            app_component_1.AppComponent,
            geoweb_component_1.GeowebComponent,
            home_component_1.HomeComponent,
            map_component_1.GeowebMapComponent,
            form_component_1.JobConfigComponent,
            map_popup_component_1.PopupFormComponent,
            disclaimer_component_1.DisclaimerComponent,
            spinner_component_1.SpinnerComponent,
            form_validators_1.ForbiddenValidatorDirective,
            callback_pipe_1.CallbackPipe,
            login_component_1.LoginComponent,
            form_instance_component_1.JobDynamicFormComponent,
            form_monaco_editor_component_1.DynamicCodeEditorComponent,
            form_mutable_array_component_1.FormMutableArrayComponent,
            file_drop_upload_component_1.FileDropUploadComponent,
            file_browser_component_1.FileBrowserComponent,
            form_file_browser_input_component_1.FileBrowserInputComponent,
            file_browser_input_component_1.FileBrowserInputControlComponent,
        ],
        entryComponents: [
            form_monaco_editor_component_1.DynamicCodeEditorComponent,
            form_mutable_array_component_1.FormMutableArrayComponent,
            form_file_browser_input_component_1.FileBrowserInputComponent,
        ],
        imports: [
            // Angular
            platform_browser_1.BrowserModule,
            animations_1.BrowserAnimationsModule,
            http_1.HttpClientModule,
            angular_jwt_1.JwtModule.forRoot({
                jwtOptionsProvider: {
                    provide: angular_jwt_1.JWT_OPTIONS,
                    useFactory: auth_service_1.jwtOptionsFactory,
                    deps: [config_service_1.ConfigService],
                },
            }),
            app_routing_module_1.AppRoutingModule,
            forms_1.FormsModule,
            forms_1.ReactiveFormsModule,
            core_2.DynamicFormsCoreModule,
            ui_primeng_1.DynamicFormsPrimeNGUIModule,
            ngx_file_drop_1.FileDropModule,
            angular_fontawesome_1.FontAwesomeModule,
            // PrimeNG
            slider_1.SliderModule,
            tooltip_1.TooltipModule,
            inputtext_1.InputTextModule,
            sidebar_1.SidebarModule,
            button_1.ButtonModule,
            orderlist_1.OrderListModule,
            colorpicker_1.ColorPickerModule,
            dropdown_1.DropdownModule,
            calendar_1.CalendarModule,
            toast_1.ToastModule,
            overlaypanel_1.OverlayPanelModule,
            card_1.CardModule,
            listbox_1.ListboxModule,
            primeng_1.ProgressBarModule,
            togglebutton_1.ToggleButtonModule,
            slidemenu_1.SlideMenuModule,
            dialog_1.DialogModule,
            panel_1.PanelModule,
            primeng_1.TabViewModule,
            tree_1.TreeModule,
            spinner_1.SpinnerModule,
            ngx_monaco_editor_1.MonacoEditorModule.forRoot(),
        ],
        providers: [
            electron_service_1.ElectronService,
            config_service_1.ConfigService,
            {
                provide: core_1.APP_INITIALIZER,
                useFactory: initialiseApp,
                multi: true,
                deps: [config_service_1.ConfigService],
            },
            // This fixes Monaco Editor loading with Electron (https://github.com/atularen/ngx-monaco-editor/issues/49)
            {
                provide: ngx_monaco_editor_1.NGX_MONACO_EDITOR_CONFIG,
                useValue: {
                    baseUrl: electron_service_1.isElectron()
                        ? `${electron_service_1.getElectronConfig().APP_PATH}assets`
                        : "./assets",
                },
            },
            // Add custom form validators
            {
                provide: forms_1.NG_VALIDATORS,
                useValue: form_validators_1.validateCustomValidator,
                multi: true,
            },
            {
                provide: core_2.DYNAMIC_VALIDATORS,
                useValue: new Map([
                    ["customValidator", form_validators_1.validateCustomValidator],
                ]),
            },
            // Add custom form controls
            {
                provide: core_2.DYNAMIC_FORM_CONTROL_MAP_FN,
                useValue: (model) => {
                    switch (model.type) {
                        case code_editor_model_1.DYNAMIC_FORM_CONTROL_TYPE_CODE_EDITOR:
                            return form_monaco_editor_component_1.DynamicCodeEditorComponent;
                        case core_2.DYNAMIC_FORM_CONTROL_TYPE_ARRAY:
                            return form_mutable_array_component_1.FormMutableArrayComponent;
                        case file_browser_input_model_1.DYNAMIC_FORM_CONTROL_TYPE_FILE_BROWSER_INPUT:
                            return form_file_browser_input_component_1.FileBrowserInputComponent;
                    }
                },
            },
        ],
        bootstrap: [app_component_1.AppComponent],
    }),
    __metadata("design:paramtypes", [core_1.Injector])
], AppModule);
exports.AppModule = AppModule;


/***/ }),

/***/ "./src/app/disclaimer/disclaimer-service.ts":
/*!**************************************************!*\
  !*** ./src/app/disclaimer/disclaimer-service.ts ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const LOCAL_STORAGE_DISCLAIMER_KEY = "disclaimerAgreedTo";
const LOCAL_STORAGE_DISCLAIMER_DATESET_KEY = "disclaimerAgreedToDateSet";
/**
 * Handles disclaimer - which is displayed after a specified time of inactivity
 *
 * @export
 * @class DisclaimerSerivce
 */
let DisclaimerSerivce = class DisclaimerSerivce {
    constructor() {
        const storedValue = window.localStorage.getItem(LOCAL_STORAGE_DISCLAIMER_KEY);
        const dateSet = window.localStorage.getItem(LOCAL_STORAGE_DISCLAIMER_DATESET_KEY);
        if (typeof storedValue !== "undefined" && typeof dateSet !== "undefined") {
            // If the disclaimer value was set in the last day - otherwise set to false
            if (new Date(dateSet).getTime() >
                new Date().getTime() - 1000 * 60 * 60 * 24) {
                this._disclaimerAgreedTo = storedValue === "true";
            }
            else {
                this._disclaimerAgreedTo = false;
            }
            // If disclaimer already agreed to - update date set
            window.localStorage.setItem(LOCAL_STORAGE_DISCLAIMER_DATESET_KEY, new Date().toUTCString());
        }
    }
    set disclaimerAgreedTo(b) {
        window.localStorage.setItem(LOCAL_STORAGE_DISCLAIMER_KEY, b ? "true" : "false");
        window.localStorage.setItem(LOCAL_STORAGE_DISCLAIMER_DATESET_KEY, new Date().toUTCString());
        this._disclaimerAgreedTo = b;
    }
    get disclaimerAgreedTo() {
        return this._disclaimerAgreedTo;
    }
};
DisclaimerSerivce = __decorate([
    core_1.Injectable({
        providedIn: "root",
    }),
    __metadata("design:paramtypes", [])
], DisclaimerSerivce);
exports.DisclaimerSerivce = DisclaimerSerivce;


/***/ }),

/***/ "./src/app/disclaimer/disclaimer.component.html":
/*!******************************************************!*\
  !*** ./src/app/disclaimer/disclaimer.component.html ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<p-panel styleClass=\"disclaimer-panel\">\n  <p-header>\n    <h1>Disclaimer</h1>\n  </p-header>\n  <p>\n    The Geoweb Website or Software should not be relied upon to provide risk\n    assessments, and must not be used for any operational, planning or risk\n    evaluation purposes. CSIRO makes no expressed or implied warranty or\n    representation of the quality or fitness for purpose of the software and\n    disclaim all liability for the consequences of anything done or omitted to\n    be done by any person in reliance upon the software or any information\n    provided by the Software.\n  </p>\n  <h3>Terms of use:</h3>\n  <ol>\n    <li>\n      The use of this Website and the Geoweb Software is for evaluation\n      purposes only.\n    </li>\n    <li>\n      Commercial usage of this Website or the Geoweb Software are not\n      permitted.\n    </li>\n    <li>\n      Operational usage of this Website or the Geoweb Software for decision\n      support or risk analysis are not permitted.\n    </li>\n  </ol>\n  <p-footer>\n    <p-button icon=\"pi pi-check\"\n      label=\"Agree\"\n      (click)=\"agreeToDisclaimer()\"></p-button>\n  </p-footer>\n</p-panel>"

/***/ }),

/***/ "./src/app/disclaimer/disclaimer.component.scss":
/*!******************************************************!*\
  !*** ./src/app/disclaimer/disclaimer.component.scss ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".ui-panel.disclaimer-panel {\n  max-width: 800px;\n  margin: 5% auto;\n  text-align: justify;\n  z-index: 1;\n  position: relative;\n  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.2); }\n\n.ui-panel.disclaimer-panel .ui-panel-titlebar,\n.ui-panel.disclaimer-panel .ui-panel-content,\n.ui-panel.disclaimer-panel .ui-panel-footer {\n  border-left: none;\n  border-right: none;\n  background-color: #ffffffc9; }\n\n.ui-panel.disclaimer-panel .ui-panel-titlebar {\n  border-top: none;\n  background-color: #ffffff87; }\n\n.ui-panel.disclaimer-panel .ui-panel-footer {\n  text-align: right;\n  border-bottom: none;\n  border-bottom-right-radius: 4px;\n  border-bottom-left-radius: 4px; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYXdhbm1hY2Jvb2svRG9jdW1lbnRzL2Rzcy9jbGllbnQvc3JjL2FwcC9kaXNjbGFpbWVyL2Rpc2NsYWltZXIuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxnQkFBZ0I7RUFDaEIsZUFBZTtFQUNmLG1CQUFtQjtFQUNuQixVQUFVO0VBQ1Ysa0JBQWtCO0VBQ2xCLHdDQUF3QyxFQUFBOztBQUcxQzs7O0VBR0UsaUJBQWlCO0VBQ2pCLGtCQUFrQjtFQUNsQiwyQkFBMkIsRUFBQTs7QUFHN0I7RUFDRSxnQkFBZ0I7RUFDaEIsMkJBQTJCLEVBQUE7O0FBRzdCO0VBQ0UsaUJBQWlCO0VBQ2pCLG1CQUFtQjtFQUNuQiwrQkFBK0I7RUFDL0IsOEJBQThCLEVBQUEiLCJmaWxlIjoic3JjL2FwcC9kaXNjbGFpbWVyL2Rpc2NsYWltZXIuY29tcG9uZW50LnNjc3MiLCJzb3VyY2VzQ29udGVudCI6WyIudWktcGFuZWwuZGlzY2xhaW1lci1wYW5lbCB7XG4gIG1heC13aWR0aDogODAwcHg7XG4gIG1hcmdpbjogNSUgYXV0bztcbiAgdGV4dC1hbGlnbjoganVzdGlmeTtcbiAgei1pbmRleDogMTtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuICBib3gtc2hhZG93OiAwIDAgMCAycHggcmdiYSgwLCAwLCAwLCAwLjIpO1xufVxuXG4udWktcGFuZWwuZGlzY2xhaW1lci1wYW5lbCAudWktcGFuZWwtdGl0bGViYXIsXG4udWktcGFuZWwuZGlzY2xhaW1lci1wYW5lbCAudWktcGFuZWwtY29udGVudCxcbi51aS1wYW5lbC5kaXNjbGFpbWVyLXBhbmVsIC51aS1wYW5lbC1mb290ZXIge1xuICBib3JkZXItbGVmdDogbm9uZTtcbiAgYm9yZGVyLXJpZ2h0OiBub25lO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmZmZmYzk7XG59XG5cbi51aS1wYW5lbC5kaXNjbGFpbWVyLXBhbmVsIC51aS1wYW5lbC10aXRsZWJhciB7XG4gIGJvcmRlci10b3A6IG5vbmU7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmZmZmY4Nztcbn1cblxuLnVpLXBhbmVsLmRpc2NsYWltZXItcGFuZWwgLnVpLXBhbmVsLWZvb3RlciB7XG4gIHRleHQtYWxpZ246IHJpZ2h0O1xuICBib3JkZXItYm90dG9tOiBub25lO1xuICBib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1czogNHB4O1xuICBib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzOiA0cHg7XG59XG4iXX0= */"

/***/ }),

/***/ "./src/app/disclaimer/disclaimer.component.ts":
/*!****************************************************!*\
  !*** ./src/app/disclaimer/disclaimer.component.ts ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const disclaimer_service_1 = __webpack_require__(/*! ./disclaimer-service */ "./src/app/disclaimer/disclaimer-service.ts");
const router_1 = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm2015/router.js");
/**
 * Displays disclaimer
 *
 * @export
 * @class DisclaimerComponent
 */
let DisclaimerComponent = class DisclaimerComponent {
    constructor(disclaimerService, router) {
        this.disclaimerService = disclaimerService;
        this.router = router;
    }
    agreeToDisclaimer() {
        this.disclaimerService.disclaimerAgreedTo = true;
        this.router.navigate([this.redirectTo]);
    }
};
__decorate([
    core_1.Input(),
    __metadata("design:type", String)
], DisclaimerComponent.prototype, "redirectTo", void 0);
DisclaimerComponent = __decorate([
    core_1.Component({
        selector: "app-disclaimer",
        template: __webpack_require__(/*! ./disclaimer.component.html */ "./src/app/disclaimer/disclaimer.component.html"),
        encapsulation: core_1.ViewEncapsulation.None,
        styles: [__webpack_require__(/*! ./disclaimer.component.scss */ "./src/app/disclaimer/disclaimer.component.scss")]
    }),
    __metadata("design:paramtypes", [disclaimer_service_1.DisclaimerSerivce,
        router_1.Router])
], DisclaimerComponent);
exports.DisclaimerComponent = DisclaimerComponent;


/***/ }),

/***/ "./src/app/file-browser/file-browser.component.html":
/*!**********************************************************!*\
  !*** ./src/app/file-browser/file-browser.component.html ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<p-dialog header=\"Pick File\"\n  [(visible)]=\"visible\"\n  [modal]=\"false\"\n  styleClass=\"file-browser-dialog modal-dialog\"\n  [closeOnEscape]=\"true\"\n  [draggable]=\"false\"\n  [resizable]=\"false\"\n  transitionOptions=\"0ms\"\n  #fileBrowserDialog>\n  <div class=\"file-browser-container\"\n    *ngIf=\"visible\">\n    <div class=\"ui-grid ui-grid-responsive ui-fluid\">\n      <div class=\"ui-grid-row\">\n        <div class=\"ui-grid-col-12\">\n          <p-tree [value]=\"files\"\n            selectionMode=\"single\"\n            [(selection)]=\"selectedFile\"\n            #fileBrowserTree>\n          </p-tree>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <p-footer>\n    <button type=\"button\"\n      pButton\n      icon=\"pi pi-trash\"\n      (click)=\"clearSelection()\"\n      label=\"Clear\"\n      class=\"ui-button-danger-outline\"\n      style=\"float: left;\"\n      *ngIf=\"selectedFile !== undefined\"></button>\n\n    <button type=\"button\"\n      pButton\n      icon=\"pi pi-times\"\n      (click)=\"cancel()\"\n      label=\"Cancel\"\n      class=\"ui-button-secondary\"></button>\n    <button type=\"button\"\n      pButton\n      icon=\"pi pi-check\"\n      (click)=\"submit()\"\n      label=\"Select\"></button>\n  </p-footer>\n</p-dialog>"

/***/ }),

/***/ "./src/app/file-browser/file-browser.component.scss":
/*!**********************************************************!*\
  !*** ./src/app/file-browser/file-browser.component.scss ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".file-browser-dialog.modal-dialog.ui-dialog {\n  top: 5vh !important;\n  left: 50% !important;\n  transform: translate(-50%, 0) !important;\n  width: auto;\n  max-width: 80vw;\n  min-width: 400px; }\n\nbody .ui-dialog .ui-dialog-header,\nbody .ui-dialog .ui-dialog-footer {\n  border-right: none;\n  border-left: none; }\n\nbody .ui-dialog .ui-dialog-header {\n  border-top: none; }\n\nbody .ui-dialog .ui-dialog-footer {\n  border-bottom: none; }\n\n.file-browser-dialog.modal-dialog.ui-dialog .ui-dialog-content {\n  padding: 0;\n  height: calc(90vh - 100px); }\n\n.file-browser-dialog .ui-tree {\n  border: none;\n  padding: 0.5em; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYXdhbm1hY2Jvb2svRG9jdW1lbnRzL2Rzcy9jbGllbnQvc3JjL2FwcC9maWxlLWJyb3dzZXIvZmlsZS1icm93c2VyLmNvbXBvbmVudC5zY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsbUJBQW1CO0VBQ25CLG9CQUFvQjtFQUNwQix3Q0FBd0M7RUFDeEMsV0FBVztFQUNYLGVBQWU7RUFDZixnQkFBZ0IsRUFBQTs7QUFHbEI7O0VBRUUsa0JBQWtCO0VBQ2xCLGlCQUFpQixFQUFBOztBQUduQjtFQUNFLGdCQUFnQixFQUFBOztBQUdsQjtFQUNFLG1CQUFtQixFQUFBOztBQUdyQjtFQUNFLFVBQVU7RUFDViwwQkFBMEIsRUFBQTs7QUFHNUI7RUFDRSxZQUFZO0VBQ1osY0FBYyxFQUFBIiwiZmlsZSI6InNyYy9hcHAvZmlsZS1icm93c2VyL2ZpbGUtYnJvd3Nlci5jb21wb25lbnQuc2NzcyIsInNvdXJjZXNDb250ZW50IjpbIi5maWxlLWJyb3dzZXItZGlhbG9nLm1vZGFsLWRpYWxvZy51aS1kaWFsb2cge1xuICB0b3A6IDV2aCAhaW1wb3J0YW50O1xuICBsZWZ0OiA1MCUgIWltcG9ydGFudDtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgMCkgIWltcG9ydGFudDtcbiAgd2lkdGg6IGF1dG87XG4gIG1heC13aWR0aDogODB2dztcbiAgbWluLXdpZHRoOiA0MDBweDtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctaGVhZGVyLFxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctZm9vdGVyIHtcbiAgYm9yZGVyLXJpZ2h0OiBub25lO1xuICBib3JkZXItbGVmdDogbm9uZTtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctaGVhZGVyIHtcbiAgYm9yZGVyLXRvcDogbm9uZTtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctZm9vdGVyIHtcbiAgYm9yZGVyLWJvdHRvbTogbm9uZTtcbn1cblxuLmZpbGUtYnJvd3Nlci1kaWFsb2cubW9kYWwtZGlhbG9nLnVpLWRpYWxvZyAudWktZGlhbG9nLWNvbnRlbnQge1xuICBwYWRkaW5nOiAwO1xuICBoZWlnaHQ6IGNhbGMoOTB2aCAtIDEwMHB4KTtcbn1cblxuLmZpbGUtYnJvd3Nlci1kaWFsb2cgLnVpLXRyZWUge1xuICBib3JkZXI6IG5vbmU7XG4gIHBhZGRpbmc6IDAuNWVtO1xufVxuIl19 */"

/***/ }),

/***/ "./src/app/file-browser/file-browser.component.ts":
/*!********************************************************!*\
  !*** ./src/app/file-browser/file-browser.component.ts ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const file_browser_service_1 = __webpack_require__(/*! ./file-browser.service */ "./src/app/file-browser/file-browser.service.ts");
const tree_1 = __webpack_require__(/*! primeng/tree */ "./node_modules/primeng/tree.js");
/**
 * Displays a file browser - it contains a tree-like interface and communicates with fileBrowserService
 *
 * @export
 * @class FileBrowserComponent
 */
let FileBrowserComponent = class FileBrowserComponent {
    constructor(fileBrowserService) {
        this.fileBrowserService = fileBrowserService;
        this.visible = false;
        this.visibleSubscription = fileBrowserService
            .isVisibleObservable()
            .subscribe(visible => {
            this.visible = visible;
            if (visible) {
                this.options = this.fileBrowserService.options;
            }
        });
        this.filesSubscription = fileBrowserService
            .getFilesObservable()
            .subscribe(files => {
            this.files = files;
        });
        this.selectedFileSubscription = fileBrowserService
            .getSelectedFileObservable()
            .subscribe(file => {
            this.selectedFile = file;
        });
    }
    ngOnInit() { }
    ngOnDestroy() {
        this.visibleSubscription.unsubscribe();
        this.filesSubscription.unsubscribe();
        this.selectedFileSubscription.unsubscribe();
    }
    cancel() {
        this.fileBrowserService.cancel();
    }
    submit() {
        if (typeof this.selectedFile !== "undefined") {
            this.fileBrowserService.submit(this.selectedFile.data);
        }
        else {
            this.fileBrowserService.submit(undefined);
        }
    }
    clearSelection() {
        this.selectedFile = undefined;
    }
};
__decorate([
    core_1.ViewChild("fileBrowserTree"),
    __metadata("design:type", tree_1.Tree)
], FileBrowserComponent.prototype, "fileBrowserTree", void 0);
FileBrowserComponent = __decorate([
    core_1.Component({
        selector: "app-file-browser",
        template: __webpack_require__(/*! ./file-browser.component.html */ "./src/app/file-browser/file-browser.component.html"),
        encapsulation: core_1.ViewEncapsulation.None,
        styles: [__webpack_require__(/*! ./file-browser.component.scss */ "./src/app/file-browser/file-browser.component.scss")]
    }),
    __metadata("design:paramtypes", [file_browser_service_1.FileBrowserService])
], FileBrowserComponent);
exports.FileBrowserComponent = FileBrowserComponent;


/***/ }),

/***/ "./src/app/file-browser/file-browser.service.ts":
/*!******************************************************!*\
  !*** ./src/app/file-browser/file-browser.service.ts ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm2015/index.js");
const array_1 = __webpack_require__(/*! ../../../../shared/src/util/array */ "../shared/src/util/array.ts");
const config_service_1 = __webpack_require__(/*! ../services/config.service */ "./src/app/services/config.service.ts");
const file_browser_input_model_1 = __webpack_require__(/*! ../form/file-browser-input/file-browser-input-model */ "./src/app/form/file-browser-input/file-browser-input-model.ts");
/**
 * This service is used to trigger/display the FileBrowser component it also contains functions for interacting with FileBrowserNode
 *
 * @export
 * @class FileBrowserService
 */
let FileBrowserService = class FileBrowserService {
    constructor(configService) {
        this.configService = configService;
        this.visible = false;
        this.visibleSubject = new rxjs_1.Subject();
        this.filesSubject = new rxjs_1.Subject();
        this.selectedFileSubject = new rxjs_1.Subject();
        this.submittedFileSubject = new rxjs_1.Subject(); // Subject fired on file submit and cancel
        this.needToUpdateFiles = false;
    }
    get options() {
        return this._options;
    }
    ngOnDestroy() { }
    isVisibleObservable() {
        return this.visibleSubject.asObservable();
    }
    getFilesObservable() {
        return this.filesSubject.asObservable();
    }
    getSelectedFileObservable() {
        return this.selectedFileSubject.asObservable();
    }
    // TODO: preserve previously expanded items
    updateFiles(publishFilesSubject = true) {
        this.files = [];
        // NOT CURRENTLY IMPLEMENTED...
        if (publishFilesSubject) {
            this.filesSubject.next(this.files);
        }
        if (this.configService.debugMode) {
            console.log(this.files);
        }
        this.needToUpdateFiles = false;
    }
    directoryTreeToTreeNodeArray(dirTree, parent) {
        const treeNode = {
            label: dirTree.name,
            data: dirTree,
            selectable: true,
            parent,
        };
        treeNode.children = Array.isArray(dirTree.children)
            ? dirTree.children.map(child => this.directoryTreeToTreeNodeArray.bind(this)(child, treeNode))
            : [];
        return treeNode;
    }
    updateOptions(options) {
        this._options = new file_browser_input_model_1.FileBrowserOptions(options);
        // Set selectableType ('file' or 'directory')
        // First set all files to selectable if they have a data field
        this.setPropertyRecursive(this.files, node => {
            node.selectable = "data" in node;
        });
        if (this._options.selectableType) {
            this.setPropertyRecursive(this.files, node => {
                node.selectable =
                    node.selectable &&
                        node.data &&
                        node.data.type === this._options.selectableType;
            });
        }
    }
    findSelectedFileInTreeNodes(targetFile, treeNodes = this.files) {
        if (typeof treeNodes === "undefined" ||
            treeNodes.length === 0 ||
            typeof targetFile === "undefined") {
            return [];
        }
        return array_1.flattenArray(treeNodes.map(file => {
            if (file.label === targetFile.label &&
                file.data.path === targetFile.data.path) {
                return [file];
            }
            if (Array.isArray(file.children) && file.children.length > 0) {
                return this.findSelectedFileInTreeNodes(targetFile, file.children);
            }
        })).filter(match => typeof match !== "undefined");
    }
    setPropertyFromChild(node, toSet) {
        if (typeof toSet === "function") {
            toSet(node);
        }
        else {
            Object.assign(node, toSet);
        }
        if (node.parent) {
            this.setPropertyFromChild(node.parent, toSet);
        }
    }
    setPropertyRecursive(nodes, toSet) {
        nodes.forEach(node => {
            if (typeof toSet === "function") {
                toSet(node);
            }
            else {
                Object.assign(node, toSet);
            }
            if (node.children) {
                this.setPropertyRecursive(node.children, toSet);
            }
        });
    }
    expandToFile(file) {
        if (typeof file !== "undefined") {
            this.expandRecursiveFromChild(file);
        }
    }
    expandRecursive(nodes, isExpand) {
        this.setPropertyRecursive(nodes, { expanded: isExpand });
    }
    expandRecursiveFromChild(node, isExpand = true) {
        this.setPropertyFromChild(node, { expanded: isExpand });
    }
    show(options, selected) {
        // If already visible - cancel previous instance
        if (this.visible) {
            this.cancel();
        }
        if (this.needToUpdateFiles) {
            this.updateFiles(false);
        }
        // Update options
        this.updateOptions(options);
        // Convert selected file to a FileBrowserNode - and try to locate it in the File Tree (and expand all files to it)
        let selectedFileNode;
        if (typeof selected !== "undefined") {
            selectedFileNode = this.findSelectedFileInTreeNodes(this.directoryTreeToTreeNodeArray(selected))[0];
            this.expandToFile(selectedFileNode);
        }
        this.filesSubject.next(this.files);
        this.selectedFileSubject.next(selectedFileNode);
        this.visible = true;
        this.visibleSubject.next(this.visible);
        // Return a promise which is resolved when a a file is pushed to the submittedFileSubject by the FileBrowserComponent
        return new Promise((resolve, reject) => {
            const sub = this.submittedFileSubject.subscribe(dirTree => {
                if (dirTree === "cancel") {
                    reject("cancel");
                }
                else {
                    resolve(dirTree);
                }
                sub.unsubscribe();
            });
        });
    }
    hide() {
        if (this.visible) {
            this.visible = false;
            this.visibleSubject.next(this.visible);
        }
    }
    submit(dirTree) {
        this.visible = false;
        this.visibleSubject.next(this.visible);
        this.submittedFileSubject.next(dirTree);
    }
    cancel() {
        this.visible = false;
        this.visibleSubject.next(this.visible);
        this.submittedFileSubject.next("cancel");
    }
};
FileBrowserService = __decorate([
    core_1.Injectable({
        providedIn: "root",
    }),
    __metadata("design:paramtypes", [config_service_1.ConfigService])
], FileBrowserService);
exports.FileBrowserService = FileBrowserService;


/***/ }),

/***/ "./src/app/file-drop-upload/file-drop-upload.component.html":
/*!******************************************************************!*\
  !*** ./src/app/file-drop-upload/file-drop-upload.component.html ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<file-drop\n  [dropZoneClassName]=\"dropZoneClassName\"\n  [contentClassName]=\"dropZoneClassName + '-content'\"\n  (onFileDrop)=\"dropped($event)\"\n  (onFileOver)=\"fileOver($event)\"\n  (onFileLeave)=\"fileLeave($event)\"\n>\n  <ng-content></ng-content>\n</file-drop>\n"

/***/ }),

/***/ "./src/app/file-drop-upload/file-drop-upload.component.scss":
/*!******************************************************************!*\
  !*** ./src/app/file-drop-upload/file-drop-upload.component.scss ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2ZpbGUtZHJvcC11cGxvYWQvZmlsZS1kcm9wLXVwbG9hZC5jb21wb25lbnQuc2NzcyJ9 */"

/***/ }),

/***/ "./src/app/file-drop-upload/file-drop-upload.component.ts":
/*!****************************************************************!*\
  !*** ./src/app/file-drop-upload/file-drop-upload.component.ts ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const spinner_service_service_1 = __webpack_require__(/*! ../spinner/spinner-service.service */ "./src/app/spinner/spinner-service.service.ts");
const rest_api_service_1 = __webpack_require__(/*! ../services/rest-api.service */ "./src/app/services/rest-api.service.ts");
const job_service_service_1 = __webpack_require__(/*! ../services/job-service.service */ "./src/app/services/job-service.service.ts");
const message_api_1 = __webpack_require__(/*! ../../../../shared/src/message-api */ "../shared/src/message-api/index.ts");
const flash_message_service_1 = __webpack_require__(/*! ../services/flash-message.service */ "./src/app/services/flash-message.service.ts");
/**
 * This component handles uploading files when they are dropped on the screen
 *
 * @export
 * @class FileDropUploadComponent
 */
let FileDropUploadComponent = class FileDropUploadComponent {
    constructor(spinnerService, restApiService, jobService, flashMessageService) {
        this.spinnerService = spinnerService;
        this.restApiService = restApiService;
        this.jobService = jobService;
        this.flashMessageService = flashMessageService;
        this.state = "none";
        this.files = [];
    }
    ngOnInit() { }
    dropped(event) {
        this.spinnerService.removeSpinner(`file-drop-upload-over`);
        this.state = "uploading";
        this.files = event.files;
        const currentJob = this.jobService.getCurrentJob();
        if (typeof currentJob === "undefined" ||
            typeof currentJob.inputDirectory !== "string") {
            this.flashMessageService.pushFlashMessage(new message_api_1.FlashMessage({
                title: `Failed to upload files: no job is loaded`,
                message: "Please load a job before trying to upload files",
                sticky: true,
            }));
            return;
        }
        for (const droppedFile of event.files) {
            // Is it a file?
            if (droppedFile.fileEntry.isFile) {
                this.spinnerService.setSpinner(`file-drop-upload-uploading-${droppedFile.fileEntry.name}`, {
                    name: `Uploading file ${droppedFile.fileEntry.name}`,
                    icon: spinner_service_service_1.SpinnerIcon.RotatingCircle,
                    progress: 0,
                    target: "file-drop-upload",
                });
                const fileEntry = droppedFile.fileEntry;
                fileEntry.file((file) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield this.restApiService.uploadJobFile(file, `${currentJob.inputDirectory}${droppedFile.relativePath}`, currentJob.name, progress => {
                            this.spinnerService.updateSpinner(`file-drop-upload-uploading-${droppedFile.fileEntry.name}`, {
                                progress,
                            });
                        });
                        this.flashMessageService.pushFlashMessage(new message_api_1.FlashMessage({
                            title: `Sucessfull upload`,
                            message: `Sucessfully uploaded file ${file.name}`,
                            severity: "success",
                        }));
                    }
                    catch (error) {
                        this.flashMessageService.pushFlashMessage(new message_api_1.FlashMessage({
                            title: `Failed to upload file ${file.name}`,
                            message: "message" in error ? error.message : error,
                            sticky: true,
                        }));
                    }
                    finally {
                        this.spinnerService.removeSpinner(`file-drop-upload-uploading-${droppedFile.fileEntry.name}`);
                    }
                }));
            }
            else {
                // It was a directory (empty directories are added, otherwise only files)
                const fileEntry = droppedFile.fileEntry;
            }
        }
    }
    fileOver(event) {
        this.state = "over";
        this.spinnerService.setSpinner(`file-drop-upload-over`, {
            name: `Drop to load files...`,
            icon: spinner_service_service_1.SpinnerIcon.BallScale,
            target: "file-drop-upload",
        });
    }
    fileLeave(event) {
        this.spinnerService.removeSpinner(`file-drop-upload-over`);
        this.state = "none";
    }
};
__decorate([
    core_1.Input(),
    __metadata("design:type", String)
], FileDropUploadComponent.prototype, "dropZoneClassName", void 0);
FileDropUploadComponent = __decorate([
    core_1.Component({
        selector: "app-file-drop-upload",
        template: __webpack_require__(/*! ./file-drop-upload.component.html */ "./src/app/file-drop-upload/file-drop-upload.component.html"),
        styles: [__webpack_require__(/*! ./file-drop-upload.component.scss */ "./src/app/file-drop-upload/file-drop-upload.component.scss")]
    }),
    __metadata("design:paramtypes", [spinner_service_service_1.SpinnerService,
        rest_api_service_1.RestApiService,
        job_service_service_1.JobService,
        flash_message_service_1.FlashMessageService])
], FileDropUploadComponent);
exports.FileDropUploadComponent = FileDropUploadComponent;


/***/ }),

/***/ "./src/app/form/file-browser-input/file-browser-input-model.ts":
/*!*********************************************************************!*\
  !*** ./src/app/form/file-browser-input/file-browser-input-model.ts ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @ng-dynamic-forms/core */ "./node_modules/@ng-dynamic-forms/core/fesm2015/core.js");
exports.DYNAMIC_FORM_CONTROL_TYPE_FILE_BROWSER_INPUT = "FILE_BROWSER_INPUT";
/**
 * Options for FileBroserInputModel
 *
 * @export
 * @class FileBrowserOptions
 */
class FileBrowserOptions {
    constructor(obj) {
        if (obj) {
            Object.assign(this, obj);
        }
    }
}
exports.FileBrowserOptions = FileBrowserOptions;
/**
 * DynamicFormValueControlModel for FileBrowserInput
 *
 * @export
 * @class FileBrowserInputModel
 */
class FileBrowserInputModel extends core_1.DynamicFormValueControlModel {
    constructor(config, layout) {
        super(config, layout);
        this.type = exports.DYNAMIC_FORM_CONTROL_TYPE_FILE_BROWSER_INPUT;
        this.options = config.options;
    }
}
__decorate([
    core_1.serializable(),
    __metadata("design:type", FileBrowserOptions)
], FileBrowserInputModel.prototype, "options", void 0);
__decorate([
    core_1.serializable(),
    __metadata("design:type", String)
], FileBrowserInputModel.prototype, "type", void 0);
exports.FileBrowserInputModel = FileBrowserInputModel;


/***/ }),

/***/ "./src/app/form/file-browser-input/file-browser-input.component.html":
/*!***************************************************************************!*\
  !*** ./src/app/form/file-browser-input/file-browser-input.component.html ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div (click)=\"openFileBrowser()\">\n  <p-button\n    *ngIf=\"file !== undefined\"\n    [label]=\"file.name\"\n    styleClass=\"ui-button-info ui-button-rounded file-browser-button\"\n    [icon]=\"file.type === 'file' ? 'pi pi-file' : 'pi pi-folder'\"\n    iconPos=\"left\"\n  ></p-button>\n  <p-button\n    *ngIf=\"file === undefined\"\n    label=\"Select file...\"\n    styleClass=\"ui-button-secondary ui-button-rounded file-browser-button\"\n    icon=\"pi pi-folder-open\"\n    iconPos=\"left\"\n  ></p-button>\n</div>\n"

/***/ }),

/***/ "./src/app/form/file-browser-input/file-browser-input.component.scss":
/*!***************************************************************************!*\
  !*** ./src/app/form/file-browser-input/file-browser-input.component.scss ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".file-browser-button {\n  max-width: 100%; }\n\n.file-browser-button span {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYXdhbm1hY2Jvb2svRG9jdW1lbnRzL2Rzcy9jbGllbnQvc3JjL2FwcC9mb3JtL2ZpbGUtYnJvd3Nlci1pbnB1dC9maWxlLWJyb3dzZXItaW5wdXQuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxlQUFlLEVBQUE7O0FBR2pCO0VBQ0UsbUJBQW1CO0VBQ25CLGdCQUFnQjtFQUNoQix1QkFBdUIsRUFBQSIsImZpbGUiOiJzcmMvYXBwL2Zvcm0vZmlsZS1icm93c2VyLWlucHV0L2ZpbGUtYnJvd3Nlci1pbnB1dC5jb21wb25lbnQuc2NzcyIsInNvdXJjZXNDb250ZW50IjpbIi5maWxlLWJyb3dzZXItYnV0dG9uIHtcbiAgbWF4LXdpZHRoOiAxMDAlO1xufVxuXG4uZmlsZS1icm93c2VyLWJ1dHRvbiBzcGFuIHtcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG59XG4iXX0= */"

/***/ }),

/***/ "./src/app/form/file-browser-input/file-browser-input.component.ts":
/*!*************************************************************************!*\
  !*** ./src/app/form/file-browser-input/file-browser-input.component.ts ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
var FileBrowserInputControlComponent_1;
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const forms_1 = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm2015/forms.js");
const file_browser_service_1 = __webpack_require__(/*! ../../file-browser/file-browser.service */ "./src/app/file-browser/file-browser.service.ts");
const file_browser_input_model_1 = __webpack_require__(/*! ./file-browser-input-model */ "./src/app/form/file-browser-input/file-browser-input-model.ts");
const interfaces_1 = __webpack_require__(/*! ../../../../../shared/src/file-provider/interfaces */ "../shared/src/file-provider/interfaces.ts");
/**
 * FileBrowserInput control for DynamicForms. This component is embedded in FileBrowserInputComponent's view template
 *
 * @export
 * @class FileBrowserInputControlComponent
 */
let FileBrowserInputControlComponent = FileBrowserInputControlComponent_1 = class FileBrowserInputControlComponent {
    constructor(fileBrowserService, cdr) {
        this.fileBrowserService = fileBrowserService;
        this.cdr = cdr;
        this.propagateChange = () => { };
        this.validateFn = () => { };
    }
    ngOnDestroy() {
        this.cdr.detach();
    }
    get file() {
        return this._file;
    }
    set file(val) {
        this._file = val;
        this.propagateChange(val);
        try {
            this.cdr.detectChanges();
        }
        catch (_a) { }
    }
    writeValue(value) {
        if (value) {
            this.file = value;
        }
    }
    registerOnChange(fn) {
        this.propagateChange = fn;
    }
    registerOnTouched() { }
    validate(c) {
        return this.validateFn(c);
    }
    openFileBrowser() {
        return __awaiter(this, void 0, void 0, function* () {
            this.file = yield this.fileBrowserService.show(this.options, this.file);
        });
    }
};
__decorate([
    core_1.Input("file"),
    __metadata("design:type", interfaces_1.DirectoryTree)
], FileBrowserInputControlComponent.prototype, "_file", void 0);
__decorate([
    core_1.Input("options"),
    __metadata("design:type", file_browser_input_model_1.FileBrowserOptions)
], FileBrowserInputControlComponent.prototype, "options", void 0);
FileBrowserInputControlComponent = FileBrowserInputControlComponent_1 = __decorate([
    core_1.Component({
        selector: "app-file-browser-input",
        template: __webpack_require__(/*! ./file-browser-input.component.html */ "./src/app/form/file-browser-input/file-browser-input.component.html"),
        providers: [
            {
                provide: forms_1.NG_VALUE_ACCESSOR,
                useExisting: core_1.forwardRef(() => FileBrowserInputControlComponent_1),
                multi: true,
            },
        ],
        encapsulation: core_1.ViewEncapsulation.None,
        styles: [__webpack_require__(/*! ./file-browser-input.component.scss */ "./src/app/form/file-browser-input/file-browser-input.component.scss")]
    }),
    __metadata("design:paramtypes", [file_browser_service_1.FileBrowserService,
        core_1.ChangeDetectorRef])
], FileBrowserInputControlComponent);
exports.FileBrowserInputControlComponent = FileBrowserInputControlComponent;


/***/ }),

/***/ "./src/app/form/file-browser-input/form-file-browser-input.component.html":
/*!********************************************************************************!*\
  !*** ./src/app/form/file-browser-input/form-file-browser-input.component.html ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div\n  [formGroup]=\"group\"\n  [ngClass]=\"[getClass('element', 'control'), getClass('grid', 'control')]\"\n>\n  <app-file-browser-input\n    [formControlName]=\"model.id\"\n    [id]=\"elementId\"\n    [ngClass]=\"getClass('element', 'control')\"\n    (blur)=\"onBlur($event)\"\n    (change)=\"onChange($event)\"\n    (focus)=\"onFocus($event)\"\n    [tabindex]=\"model.tabIndex\"\n    [options]=\"model.options\"\n  ></app-file-browser-input>\n</div>\n"

/***/ }),

/***/ "./src/app/form/file-browser-input/form-file-browser-input.component.scss":
/*!********************************************************************************!*\
  !*** ./src/app/form/file-browser-input/form-file-browser-input.component.scss ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2Zvcm0vZmlsZS1icm93c2VyLWlucHV0L2Zvcm0tZmlsZS1icm93c2VyLWlucHV0LmNvbXBvbmVudC5zY3NzIn0= */"

/***/ }),

/***/ "./src/app/form/file-browser-input/form-file-browser-input.component.ts":
/*!******************************************************************************!*\
  !*** ./src/app/form/file-browser-input/form-file-browser-input.component.ts ***!
  \******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const forms_1 = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm2015/forms.js");
const core_2 = __webpack_require__(/*! @ng-dynamic-forms/core */ "./node_modules/@ng-dynamic-forms/core/fesm2015/core.js");
const file_browser_input_model_1 = __webpack_require__(/*! ./file-browser-input-model */ "./src/app/form/file-browser-input/file-browser-input-model.ts");
/**
 * FileBrowser DynamicFormControlComponent. This allows a FileBrowserInput to be used in a DynamicForm
 *
 * @export
 * @class FileBrowserInputComponent
 */
let FileBrowserInputComponent = class FileBrowserInputComponent extends core_2.DynamicFormControlComponent {
    constructor(layoutService, validationService) {
        super(layoutService, validationService);
        this.layoutService = layoutService;
        this.validationService = validationService;
        this.blur = new core_1.EventEmitter();
        this.change = new core_1.EventEmitter();
        this.customEvent = new core_1.EventEmitter();
        this.focus = new core_1.EventEmitter();
    }
    ngOnInit() { }
    ngAfterViewInit() { }
    ngOnDestroy() { }
};
__decorate([
    core_1.Input(),
    __metadata("design:type", forms_1.FormGroup)
], FileBrowserInputComponent.prototype, "group", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Object)
], FileBrowserInputComponent.prototype, "layout", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", file_browser_input_model_1.FileBrowserInputModel)
], FileBrowserInputComponent.prototype, "model", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], FileBrowserInputComponent.prototype, "blur", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], FileBrowserInputComponent.prototype, "change", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], FileBrowserInputComponent.prototype, "customEvent", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], FileBrowserInputComponent.prototype, "focus", void 0);
FileBrowserInputComponent = __decorate([
    core_1.Component({
        selector: "app-form-file-browser-input",
        template: __webpack_require__(/*! ./form-file-browser-input.component.html */ "./src/app/form/file-browser-input/form-file-browser-input.component.html"),
        changeDetection: core_1.ChangeDetectionStrategy.OnPush,
        encapsulation: core_1.ViewEncapsulation.None,
        styles: [__webpack_require__(/*! ./form-file-browser-input.component.scss */ "./src/app/form/file-browser-input/form-file-browser-input.component.scss")]
    }),
    __metadata("design:paramtypes", [core_2.DynamicFormLayoutService,
        core_2.DynamicFormValidationService])
], FileBrowserInputComponent);
exports.FileBrowserInputComponent = FileBrowserInputComponent;


/***/ }),

/***/ "./src/app/form/form-instance.component.html":
/*!***************************************************!*\
  !*** ./src/app/form/form-instance.component.html ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<!-- If formSchema has more than one element => render tabView -->\n<div *ngIf=\"formSchema.length > 1\" #rootElement>\n  <p-tabView>\n    <p-tabPanel\n      [header]=\"formModel.name\"\n      *ngFor=\"let formModel of formSchema; let i = index\"\n      [selected]=\"i == 0\"\n      #tabPanel\n    >\n      <!-- If formModel.form contains more forms => render another app-form-instance (recursively) -->\n      <app-form-instance\n        *ngIf=\"isArray(formModel.form) && tabPanel.selected\"\n        [formSchema]=\"formModel.form\"\n      ></app-form-instance>\n\n      <!-- Else it only contains one form => render the form  -->\n      <div\n        [class]=\"'form-container form ' + formModel.form.styleClass\"\n        *ngIf=\"!isArray(formModel.form) && tabPanel.selected\"\n      >\n        <form [formGroup]=\"formModel.form.formGroup\">\n          <dynamic-primeng-form\n            [group]=\"formModel.form.formGroup\"\n            [model]=\"formModel.form.model\"\n            [layout]=\"formModel.form.layout\"\n          ></dynamic-primeng-form>\n        </form>\n      </div>\n    </p-tabPanel>\n  </p-tabView>\n</div>\n\n<!-- If formSchema is only one element => no need for tabView -->\n<div *ngIf=\"formSchema.length === 1\" #rootElement>\n  <!-- If formSchema[0].form contains more forms => render another app-form-instance (recursively) -->\n  <app-form-instance\n    *ngIf=\"isArray(formSchema[0].form)\"\n    [formSchema]=\"formSchema[0].form\"\n  ></app-form-instance>\n\n  <!-- Else it only contains one form => render the form  -->\n  <div\n    [class]=\"'form-container form ' + formSchema[0].form.styleClass\"\n    *ngIf=\"!isArray(formSchema[0].form)\"\n  >\n    <form [formGroup]=\"formSchema[0].form.formGroup\">\n      <dynamic-primeng-form\n        [group]=\"formSchema[0].form.formGroup\"\n        [model]=\"formSchema[0].form.model\"\n        [layout]=\"formSchema[0].form.layout\"\n      ></dynamic-primeng-form>\n    </form>\n  </div>\n</div>\n"

/***/ }),

/***/ "./src/app/form/form-instance.component.scss":
/*!***************************************************!*\
  !*** ./src/app/form/form-instance.component.scss ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".form-container {\n  padding-right: 1em;\n  padding-left: 1em;\n  padding-top: 0.5em;\n  padding-bottom: 0.5em;\n  min-width: 313px; }\n\n.form-container .ui-datepicker.ui-widget.ui-widget-content {\n  min-width: 200px;\n  max-width: 300px;\n  width: 100%; }\n\n.code-textarea textarea {\n  font-family: monospace !important; }\n\ntextarea {\n  max-width: 100%; }\n\nbody\n.root-form-container\n.ui-tabview.ui-widget.ui-widget-content.ui-corner-all.ui-tabview-top {\n  padding: 0;\n  margin-top: -2px; }\n\nbody .root-form-container .ui-tabview.ui-tabview-top .ui-tabview-nav li {\n  margin: 0;\n  margin-top: -1px;\n  margin-left: -1px;\n  border-radius: 0; }\n\nbody .root-form-container .ui-tabview .ui-tabview-panels {\n  border: none;\n  padding: 0;\n  margin-top: 2px; }\n\nbody .root-form-container .ui-tabview.ui-tabview-top ul.ui-tabview-nav {\n  border-bottom: 1px solid #c8c8c8;\n  border-radius: 0;\n  background: #f4f4f4;\n  margin-top: -2px;\n  padding-right: 20px; }\n\nbody .root-form-container .ui-tabview.ui-tabview-top .ui-tabview-nav li a,\nbody .root-form-container .ui-tabview.ui-tabview-bottom .ui-tabview-nav li a,\nbody .root-form-container .ui-tabview.ui-tabview-left .ui-tabview-nav li a,\nbody .root-form-container .ui-tabview.ui-tabview-right .ui-tabview-nav li a {\n  font-weight: normal !important; }\n\nbody\n.root-form-container\n.ui-tabview.ui-tabview-top\n.ui-tabview\n.ui-tabview-nav\nli.ui-state-active {\n  background-color: #239efc;\n  border: 1px solid #239efc; }\n\nbody\n.root-form-container\n.ui-tabview.ui-tabview-top\n.ui-tabview\n.ui-tabview-nav\nli.ui-state-active:hover {\n  border: 1px solid #007bd9;\n  background-color: #007bd9; }\n\nbody\n.root-form-container\n.ui-tabview-panel\n.ui-tabview.ui-tabview-top\n.ui-tabview-nav\nli {\n  font-size: 12px;\n  margin-top: -2px; }\n\nbody\n.root-form-container\n.ui-tabview.ui-tabview-top\n.ui-tabview\n.ui-tabview\n.ui-tabview-nav\nli.ui-state-active {\n  background-color: #7ac2fa;\n  border: 1px solid #7ac2fa; }\n\nbody\n.root-form-container\n.ui-tabview.ui-tabview-top\n.ui-tabview\n.ui-tabview\n.ui-tabview-nav\nli.ui-state-active:hover {\n  border: 1px solid #239efc;\n  background-color: #239efc; }\n\nbody\n.root-form-container\n.ui-tabview-panel\n.ui-tabview.ui-tabview-top\n.ui-tabview\n.ui-tabview-nav\nli {\n  font-size: 11px;\n  margin-top: -2px; }\n\nbody .form-container .code-editor .editor-container {\n  height: calc(100vh - 230px) !important;\n  width: 100vw;\n  overflow: hidden; }\n\nbody .form-container .code-editor {\n  margin-left: -15px; }\n\n.formgroup-container {\n  padding: 0;\n  margin: 0 !important; }\n\n.form-container .ui-button,\n.form-container p-button {\n  max-width: 100%; }\n\n.formgroup-container .ui-dropdown {\n  width: 100% !important; }\n\n.formgroup-container .ui-button .ui-button-text {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis; }\n\n.formgroup-label {\n  font-weight: bold;\n  margin-bottom: 0; }\n\n.ui-sm-1,\n.ui-sm-2,\n.ui-sm-3,\n.ui-sm-4,\n.ui-sm-5,\n.ui-sm-6,\n.ui-sm-7,\n.ui-sm-8,\n.ui-sm-9,\n.ui-sm-10,\n.ui-sm-11,\n.ui-sm-12 {\n  padding: 0.5em; }\n\ndynamic-primeng-form-array .formgroup-container {\n  display: block;\n  float: left;\n  height: auto;\n  width: 100%; }\n\n.form-container\n.formgroup-tabular\n~ .formgroup-tabular\n.formgroup-tabular-child\ndiv\n> div\n> label {\n  display: none; }\n\n.form-container\n.formgroup-tabular-horizontal\n~ .formgroup-tabular-horizontal\n.formgroup-tabular-child\ndiv\n> div\n> label {\n  display: block;\n  visibility: hidden; }\n\n.form-container .formgroup-tabular .formgroup-label {\n  margin-top: 36px; }\n\n.form-container .formgroup-tabular ~ .formgroup-tabular .formgroup-label {\n  margin-top: 0; }\n\n.formgroup-tabular-horizontal {\n  width: auto !important;\n  margin-right: 10px !important;\n  display: inline-block; }\n\n.formgroup-tabular-horizontal .formgroup-tabular-child div > div > label {\n  margin-top: 0; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYXdhbm1hY2Jvb2svRG9jdW1lbnRzL2Rzcy9jbGllbnQvc3JjL2FwcC9mb3JtL2Zvcm0taW5zdGFuY2UuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxrQkFBa0I7RUFDbEIsaUJBQWlCO0VBQ2pCLGtCQUFrQjtFQUNsQixxQkFBcUI7RUFDckIsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0UsZ0JBQWdCO0VBQ2hCLGdCQUFnQjtFQUNoQixXQUFXLEVBQUE7O0FBR2I7RUFDRSxpQ0FBaUMsRUFBQTs7QUFHbkM7RUFDRSxlQUFlLEVBQUE7O0FBSWpCOzs7RUFHRSxVQUFVO0VBQ1YsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0UsU0FBUztFQUNULGdCQUFnQjtFQUNoQixpQkFBaUI7RUFDakIsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0UsWUFBWTtFQUNaLFVBQVU7RUFDVixlQUFlLEVBQUE7O0FBR2pCO0VBQ0UsZ0NBQWdDO0VBQ2hDLGdCQUFnQjtFQUNoQixtQkFBbUI7RUFDbkIsZ0JBQWdCO0VBQ2hCLG1CQUFtQixFQUFBOztBQUlyQjs7OztFQUlFLDhCQUE4QixFQUFBOztBQUloQzs7Ozs7O0VBTUUseUJBQXlCO0VBQ3pCLHlCQUF5QixFQUFBOztBQUczQjs7Ozs7O0VBTUUseUJBQXlCO0VBQ3pCLHlCQUF5QixFQUFBOztBQUczQjs7Ozs7O0VBTUUsZUFBZTtFQUNmLGdCQUFnQixFQUFBOztBQUtsQjs7Ozs7OztFQU9FLHlCQUF5QjtFQUN6Qix5QkFBeUIsRUFBQTs7QUFHM0I7Ozs7Ozs7RUFPRSx5QkFBeUI7RUFDekIseUJBQXlCLEVBQUE7O0FBRzNCOzs7Ozs7O0VBT0UsZUFBZTtFQUNmLGdCQUFnQixFQUFBOztBQUdsQjtFQUNFLHNDQUFzQztFQUN0QyxZQUFZO0VBQ1osZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0Usa0JBQWtCLEVBQUE7O0FBR3BCO0VBQ0UsVUFBVTtFQUNWLG9CQUFvQixFQUFBOztBQUd0Qjs7RUFFRSxlQUFlLEVBQUE7O0FBR2pCO0VBQ0Usc0JBQXNCLEVBQUE7O0FBR3hCO0VBQ0UsbUJBQW1CO0VBQ25CLGdCQUFnQjtFQUNoQix1QkFBdUIsRUFBQTs7QUFHekI7RUFDRSxpQkFBaUI7RUFDakIsZ0JBQWdCLEVBQUE7O0FBR2xCOzs7Ozs7Ozs7Ozs7RUFZRSxjQUFjLEVBQUE7O0FBSWhCO0VBQ0UsY0FBYztFQUNkLFdBQVc7RUFDWCxZQUFZO0VBQ1osV0FBVyxFQUFBOztBQUliOzs7Ozs7O0VBT0UsYUFBYSxFQUFBOztBQUlmOzs7Ozs7O0VBT0UsY0FBYztFQUNkLGtCQUFrQixFQUFBOztBQUlwQjtFQUNFLGdCQUFnQixFQUFBOztBQUdsQjtFQUNFLGFBQWEsRUFBQTs7QUFJZjtFQUNFLHNCQUFzQjtFQUN0Qiw2QkFBNkI7RUFDN0IscUJBQXFCLEVBQUE7O0FBR3ZCO0VBQ0UsYUFBYSxFQUFBIiwiZmlsZSI6InNyYy9hcHAvZm9ybS9mb3JtLWluc3RhbmNlLmNvbXBvbmVudC5zY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLmZvcm0tY29udGFpbmVyIHtcbiAgcGFkZGluZy1yaWdodDogMWVtO1xuICBwYWRkaW5nLWxlZnQ6IDFlbTtcbiAgcGFkZGluZy10b3A6IDAuNWVtO1xuICBwYWRkaW5nLWJvdHRvbTogMC41ZW07XG4gIG1pbi13aWR0aDogMzEzcHg7XG59XG5cbi5mb3JtLWNvbnRhaW5lciAudWktZGF0ZXBpY2tlci51aS13aWRnZXQudWktd2lkZ2V0LWNvbnRlbnQge1xuICBtaW4td2lkdGg6IDIwMHB4O1xuICBtYXgtd2lkdGg6IDMwMHB4O1xuICB3aWR0aDogMTAwJTtcbn1cblxuLmNvZGUtdGV4dGFyZWEgdGV4dGFyZWEge1xuICBmb250LWZhbWlseTogbW9ub3NwYWNlICFpbXBvcnRhbnQ7XG59XG5cbnRleHRhcmVhIHtcbiAgbWF4LXdpZHRoOiAxMDAlO1xufVxuXG4vLyBUYWIgc2VsZWN0b3JcbmJvZHlcbiAgLnJvb3QtZm9ybS1jb250YWluZXJcbiAgLnVpLXRhYnZpZXcudWktd2lkZ2V0LnVpLXdpZGdldC1jb250ZW50LnVpLWNvcm5lci1hbGwudWktdGFidmlldy10b3Age1xuICBwYWRkaW5nOiAwO1xuICBtYXJnaW4tdG9wOiAtMnB4O1xufVxuXG5ib2R5IC5yb290LWZvcm0tY29udGFpbmVyIC51aS10YWJ2aWV3LnVpLXRhYnZpZXctdG9wIC51aS10YWJ2aWV3LW5hdiBsaSB7XG4gIG1hcmdpbjogMDtcbiAgbWFyZ2luLXRvcDogLTFweDtcbiAgbWFyZ2luLWxlZnQ6IC0xcHg7XG4gIGJvcmRlci1yYWRpdXM6IDA7XG59XG5cbmJvZHkgLnJvb3QtZm9ybS1jb250YWluZXIgLnVpLXRhYnZpZXcgLnVpLXRhYnZpZXctcGFuZWxzIHtcbiAgYm9yZGVyOiBub25lO1xuICBwYWRkaW5nOiAwO1xuICBtYXJnaW4tdG9wOiAycHg7XG59XG5cbmJvZHkgLnJvb3QtZm9ybS1jb250YWluZXIgLnVpLXRhYnZpZXcudWktdGFidmlldy10b3AgdWwudWktdGFidmlldy1uYXYge1xuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2M4YzhjODtcbiAgYm9yZGVyLXJhZGl1czogMDtcbiAgYmFja2dyb3VuZDogI2Y0ZjRmNDtcbiAgbWFyZ2luLXRvcDogLTJweDtcbiAgcGFkZGluZy1yaWdodDogMjBweDtcbn1cblxuLy8gTWFrZSBsYWJlbHMgbm90IGJvbGRcbmJvZHkgLnJvb3QtZm9ybS1jb250YWluZXIgLnVpLXRhYnZpZXcudWktdGFidmlldy10b3AgLnVpLXRhYnZpZXctbmF2IGxpIGEsXG5ib2R5IC5yb290LWZvcm0tY29udGFpbmVyIC51aS10YWJ2aWV3LnVpLXRhYnZpZXctYm90dG9tIC51aS10YWJ2aWV3LW5hdiBsaSBhLFxuYm9keSAucm9vdC1mb3JtLWNvbnRhaW5lciAudWktdGFidmlldy51aS10YWJ2aWV3LWxlZnQgLnVpLXRhYnZpZXctbmF2IGxpIGEsXG5ib2R5IC5yb290LWZvcm0tY29udGFpbmVyIC51aS10YWJ2aWV3LnVpLXRhYnZpZXctcmlnaHQgLnVpLXRhYnZpZXctbmF2IGxpIGEge1xuICBmb250LXdlaWdodDogbm9ybWFsICFpbXBvcnRhbnQ7XG59XG5cbi8vIDJuZCBsZXZlbCB0YWIgbmF2aWdhdGlvbiBsaWdodGVyIGJhY2tncm91bmQgY29sb3VyXG5ib2R5XG4gIC5yb290LWZvcm0tY29udGFpbmVyXG4gIC51aS10YWJ2aWV3LnVpLXRhYnZpZXctdG9wXG4gIC51aS10YWJ2aWV3XG4gIC51aS10YWJ2aWV3LW5hdlxuICBsaS51aS1zdGF0ZS1hY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMjM5ZWZjO1xuICBib3JkZXI6IDFweCBzb2xpZCAjMjM5ZWZjO1xufVxuXG5ib2R5XG4gIC5yb290LWZvcm0tY29udGFpbmVyXG4gIC51aS10YWJ2aWV3LnVpLXRhYnZpZXctdG9wXG4gIC51aS10YWJ2aWV3XG4gIC51aS10YWJ2aWV3LW5hdlxuICBsaS51aS1zdGF0ZS1hY3RpdmU6aG92ZXIge1xuICBib3JkZXI6IDFweCBzb2xpZCAjMDA3YmQ5O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3YmQ5O1xufVxuXG5ib2R5XG4gIC5yb290LWZvcm0tY29udGFpbmVyXG4gIC51aS10YWJ2aWV3LXBhbmVsXG4gIC51aS10YWJ2aWV3LnVpLXRhYnZpZXctdG9wXG4gIC51aS10YWJ2aWV3LW5hdlxuICBsaSB7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgbWFyZ2luLXRvcDogLTJweDtcbn1cblxuLy8gM3JkIGxldmVsIChvciBtb3JlKSB0YWIgbmF2aWdhdGlvbiBsaWdodGVyIGJhY2tncm91bmQgY29sb3VyXG5cbmJvZHlcbiAgLnJvb3QtZm9ybS1jb250YWluZXJcbiAgLnVpLXRhYnZpZXcudWktdGFidmlldy10b3BcbiAgLnVpLXRhYnZpZXdcbiAgLnVpLXRhYnZpZXdcbiAgLnVpLXRhYnZpZXctbmF2XG4gIGxpLnVpLXN0YXRlLWFjdGl2ZSB7XG4gIGJhY2tncm91bmQtY29sb3I6ICM3YWMyZmE7XG4gIGJvcmRlcjogMXB4IHNvbGlkICM3YWMyZmE7XG59XG5cbmJvZHlcbiAgLnJvb3QtZm9ybS1jb250YWluZXJcbiAgLnVpLXRhYnZpZXcudWktdGFidmlldy10b3BcbiAgLnVpLXRhYnZpZXdcbiAgLnVpLXRhYnZpZXdcbiAgLnVpLXRhYnZpZXctbmF2XG4gIGxpLnVpLXN0YXRlLWFjdGl2ZTpob3ZlciB7XG4gIGJvcmRlcjogMXB4IHNvbGlkICMyMzllZmM7XG4gIGJhY2tncm91bmQtY29sb3I6ICMyMzllZmM7XG59XG5cbmJvZHlcbiAgLnJvb3QtZm9ybS1jb250YWluZXJcbiAgLnVpLXRhYnZpZXctcGFuZWxcbiAgLnVpLXRhYnZpZXcudWktdGFidmlldy10b3BcbiAgLnVpLXRhYnZpZXdcbiAgLnVpLXRhYnZpZXctbmF2XG4gIGxpIHtcbiAgZm9udC1zaXplOiAxMXB4O1xuICBtYXJnaW4tdG9wOiAtMnB4O1xufVxuXG5ib2R5IC5mb3JtLWNvbnRhaW5lciAuY29kZS1lZGl0b3IgLmVkaXRvci1jb250YWluZXIge1xuICBoZWlnaHQ6IGNhbGMoMTAwdmggLSAyMzBweCkgIWltcG9ydGFudDtcbiAgd2lkdGg6IDEwMHZ3O1xuICBvdmVyZmxvdzogaGlkZGVuO1xufVxuXG5ib2R5IC5mb3JtLWNvbnRhaW5lciAuY29kZS1lZGl0b3Ige1xuICBtYXJnaW4tbGVmdDogLTE1cHg7XG59XG5cbi5mb3JtZ3JvdXAtY29udGFpbmVyIHtcbiAgcGFkZGluZzogMDtcbiAgbWFyZ2luOiAwICFpbXBvcnRhbnQ7XG59XG5cbi5mb3JtLWNvbnRhaW5lciAudWktYnV0dG9uLFxuLmZvcm0tY29udGFpbmVyIHAtYnV0dG9uIHtcbiAgbWF4LXdpZHRoOiAxMDAlO1xufVxuXG4uZm9ybWdyb3VwLWNvbnRhaW5lciAudWktZHJvcGRvd24ge1xuICB3aWR0aDogMTAwJSAhaW1wb3J0YW50O1xufVxuXG4uZm9ybWdyb3VwLWNvbnRhaW5lciAudWktYnV0dG9uIC51aS1idXR0b24tdGV4dCB7XG4gIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xufVxuXG4uZm9ybWdyb3VwLWxhYmVsIHtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIG1hcmdpbi1ib3R0b206IDA7XG59XG5cbi51aS1zbS0xLFxuLnVpLXNtLTIsXG4udWktc20tMyxcbi51aS1zbS00LFxuLnVpLXNtLTUsXG4udWktc20tNixcbi51aS1zbS03LFxuLnVpLXNtLTgsXG4udWktc20tOSxcbi51aS1zbS0xMCxcbi51aS1zbS0xMSxcbi51aS1zbS0xMiB7XG4gIHBhZGRpbmc6IDAuNWVtO1xufVxuXG4vLyBGaXggZmxvYXQgaXNzdWVzIGZvciBEeW5hbWljQXJyYXlzIGZvcm1ncm91cC1jaGlsZFxuZHluYW1pYy1wcmltZW5nLWZvcm0tYXJyYXkgLmZvcm1ncm91cC1jb250YWluZXIge1xuICBkaXNwbGF5OiBibG9jaztcbiAgZmxvYXQ6IGxlZnQ7XG4gIGhlaWdodDogYXV0bztcbiAgd2lkdGg6IDEwMCU7XG59XG5cbi8vIEhpZGUgYWxsIGZvcm0gY29udHJvbCBsYWJlbHMgYWZ0ZXIgdGhlIGZpcnN0IGZvcm0gZ3JvdXAgLSBzZWUgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjcxNzQ4MC9jc3Mtc2VsZWN0b3ItZm9yLWZpcnN0LWVsZW1lbnQtd2l0aC1jbGFzc1xuLmZvcm0tY29udGFpbmVyXG4gIC5mb3JtZ3JvdXAtdGFidWxhclxuICB+IC5mb3JtZ3JvdXAtdGFidWxhclxuICAuZm9ybWdyb3VwLXRhYnVsYXItY2hpbGRcbiAgZGl2XG4gID4gZGl2XG4gID4gbGFiZWwge1xuICBkaXNwbGF5OiBub25lO1xufVxuXG4vLyBGb3IgdGFidWxhciBob3Jpem9udGFsIGhpZGUgbGFiZWwgKHdpdGggdmlzaWJpbGl0eSBpbnN0ZWFkIG9mIGRpc3BsYXk6bm9uZSlcbi5mb3JtLWNvbnRhaW5lclxuICAuZm9ybWdyb3VwLXRhYnVsYXItaG9yaXpvbnRhbFxuICB+IC5mb3JtZ3JvdXAtdGFidWxhci1ob3Jpem9udGFsXG4gIC5mb3JtZ3JvdXAtdGFidWxhci1jaGlsZFxuICBkaXZcbiAgPiBkaXZcbiAgPiBsYWJlbCB7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICB2aXNpYmlsaXR5OiBoaWRkZW47XG59XG5cbi8vIE9mZnNldCBmb3JtIGdyb3VwIGxhYmVsIGZvciBmaXJzdCBmb3JtIGdyb3VwIChhcyB0aGlzIGZyb20gZ3JvdXAgd2lsbCBoYXZlIGxhYmVscyAtIHNlZSBhYm92ZSlcbi5mb3JtLWNvbnRhaW5lciAuZm9ybWdyb3VwLXRhYnVsYXIgLmZvcm1ncm91cC1sYWJlbCB7XG4gIG1hcmdpbi10b3A6IDM2cHg7XG59XG5cbi5mb3JtLWNvbnRhaW5lciAuZm9ybWdyb3VwLXRhYnVsYXIgfiAuZm9ybWdyb3VwLXRhYnVsYXIgLmZvcm1ncm91cC1sYWJlbCB7XG4gIG1hcmdpbi10b3A6IDA7XG59XG5cbi8vIEhvcml6b250YWwgZm9ybSBncm91cFxuLmZvcm1ncm91cC10YWJ1bGFyLWhvcml6b250YWwge1xuICB3aWR0aDogYXV0byAhaW1wb3J0YW50O1xuICBtYXJnaW4tcmlnaHQ6IDEwcHggIWltcG9ydGFudDtcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xufVxuXG4uZm9ybWdyb3VwLXRhYnVsYXItaG9yaXpvbnRhbCAuZm9ybWdyb3VwLXRhYnVsYXItY2hpbGQgZGl2ID4gZGl2ID4gbGFiZWwge1xuICBtYXJnaW4tdG9wOiAwO1xufVxuIl19 */"

/***/ }),

/***/ "./src/app/form/form-instance.component.ts":
/*!*************************************************!*\
  !*** ./src/app/form/form-instance.component.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
/**
 * This component is used to render a tree of DynamicForms recursively. The parent component is JobConfigComponent
 *
 * @export
 * @class JobDynamicFormComponent
 */
let JobDynamicFormComponent = class JobDynamicFormComponent {
    constructor() { }
    ngOnInit() { }
    ngAfterViewInit() { }
    isArray(array) {
        return Array.isArray(array);
    }
    isInArray(key, array) {
        return array.includes(key);
    }
};
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], JobDynamicFormComponent.prototype, "formSchema", void 0);
__decorate([
    core_1.ViewChild("rootElement"),
    __metadata("design:type", core_1.ElementRef)
], JobDynamicFormComponent.prototype, "rootElement", void 0);
JobDynamicFormComponent = __decorate([
    core_1.Component({
        selector: "app-form-instance",
        template: __webpack_require__(/*! ./form-instance.component.html */ "./src/app/form/form-instance.component.html"),
        encapsulation: core_1.ViewEncapsulation.None,
        styles: [__webpack_require__(/*! ./form-instance.component.scss */ "./src/app/form/form-instance.component.scss")]
    }),
    __metadata("design:paramtypes", [])
], JobDynamicFormComponent);
exports.JobDynamicFormComponent = JobDynamicFormComponent;


/***/ }),

/***/ "./src/app/form/form-interfaces.ts":
/*!*****************************************!*\
  !*** ./src/app/form/form-interfaces.ts ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 *The following class serves as the root object for a Form
It contains a schemaFactory which generates an array of FormSchemas (IFormSchema),
it contains the Form's possible modes (which can be used to filter IFormSchema and FormControls within the IFormSchema)
and the current form mode.

An instance of this class is passed to the <app-form> component
 *
 * @export
 * @class FormRootModel
 */
class FormRootModel {
    constructor(obj = {}) {
        Object.assign(this, obj);
    }
}
exports.FormRootModel = FormRootModel;


/***/ }),

/***/ "./src/app/form/form-mutable-array/form-mutable-array.component.html":
/*!***************************************************************************!*\
  !*** ./src/app/form/form-mutable-array/form-mutable-array.component.html ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<ng-container [formGroup]=\"group\">\n  <div [ngClass]=\"getClass('grid', 'control')\">\n    <div\n      [formArrayName]=\"model.id\"\n      [id]=\"elementId\"\n      [ngClass]=\"getClass('element', 'control')\"\n    >\n      <div\n        *ngFor=\"let groupModel of model.groups; let idx = index\"\n        role=\"group\"\n        [formGroupName]=\"idx\"\n        [ngClass]=\"[getClass('element', 'group'), getClass('grid', 'group')]\"\n        class=\"form-group-control\"\n      >\n        <ng-container\n          *ngTemplateOutlet=\"startTemplate?.templateRef; context: groupModel\"\n        ></ng-container>\n\n        <dynamic-primeng-form-control\n          *ngFor=\"let _model of groupModel.group\"\n          [context]=\"groupModel\"\n          [group]=\"control.at(idx)\"\n          [hidden]=\"_model.hidden\"\n          [layout]=\"layout\"\n          [model]=\"_model\"\n          [templates]=\"templates\"\n          [ngClass]=\"[\n            getClass('element', 'host', _model),\n            getClass('grid', 'host', _model),\n            getClass('element', 'children'),\n            getClass('grid', 'children')\n          ]\"\n          (blur)=\"onBlur($event)\"\n          (change)=\"onChange($event)\"\n          (focus)=\"onFocus($event)\"\n          (pEvent)=\"onCustomEvent($event, null, true)\"\n        ></dynamic-primeng-form-control>\n\n        <ng-container\n          *ngTemplateOutlet=\"endTemplate?.templateRef; context: groupModel\"\n        ></ng-container>\n\n        <a class=\"danger-col-outline delete-button\" (click)=\"removeItem(idx)\">\n          <fa-icon [icon]=\"['fas', 'times-circle']\" size=\"sm\"></fa-icon>\n        </a>\n      </div>\n    </div>\n  </div>\n\n  <div [ngClass]=\"getClass('grid', 'label')\">\n    <a class=\"success-col-outline add-button\" (click)=\"addItem()\">\n      <fa-icon [icon]=\"['fas', 'plus-circle']\" size=\"sm\"></fa-icon>\n      Add element{{ model.label ? \" to \" + model.label : \"\" }}\n    </a>\n  </div>\n</ng-container>\n"

/***/ }),

/***/ "./src/app/form/form-mutable-array/form-mutable-array.component.scss":
/*!***************************************************************************!*\
  !*** ./src/app/form/form-mutable-array/form-mutable-array.component.scss ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".delete-button {\n  float: right;\n  position: absolute;\n  right: 0px;\n  bottom: 22px;\n  font-size: 18px; }\n\n.add-button {\n  margin-bottom: 10px !important;\n  display: block; }\n\n.form-group-control {\n  position: relative;\n  padding-right: 20px; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYXdhbm1hY2Jvb2svRG9jdW1lbnRzL2Rzcy9jbGllbnQvc3JjL2FwcC9mb3JtL2Zvcm0tbXV0YWJsZS1hcnJheS9mb3JtLW11dGFibGUtYXJyYXkuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxZQUFZO0VBQ1osa0JBQWtCO0VBQ2xCLFVBQVU7RUFDVixZQUFZO0VBQ1osZUFBZSxFQUFBOztBQUdqQjtFQUNFLDhCQUE4QjtFQUM5QixjQUFjLEVBQUE7O0FBR2hCO0VBQ0Usa0JBQWtCO0VBQ2xCLG1CQUFtQixFQUFBIiwiZmlsZSI6InNyYy9hcHAvZm9ybS9mb3JtLW11dGFibGUtYXJyYXkvZm9ybS1tdXRhYmxlLWFycmF5LmNvbXBvbmVudC5zY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLmRlbGV0ZS1idXR0b24ge1xuICBmbG9hdDogcmlnaHQ7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgcmlnaHQ6IDBweDtcbiAgYm90dG9tOiAyMnB4O1xuICBmb250LXNpemU6IDE4cHg7XG59XG5cbi5hZGQtYnV0dG9uIHtcbiAgbWFyZ2luLWJvdHRvbTogMTBweCAhaW1wb3J0YW50O1xuICBkaXNwbGF5OiBibG9jaztcbn1cblxuLmZvcm0tZ3JvdXAtY29udHJvbCB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgcGFkZGluZy1yaWdodDogMjBweDtcbn1cbiJdfQ== */"

/***/ }),

/***/ "./src/app/form/form-mutable-array/form-mutable-array.component.ts":
/*!*************************************************************************!*\
  !*** ./src/app/form/form-mutable-array/form-mutable-array.component.ts ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Adapted from ng-form DynamicPrimeNgFormArrayComponent
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const forms_1 = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm2015/forms.js");
const core_2 = __webpack_require__(/*! @ng-dynamic-forms/core */ "./node_modules/@ng-dynamic-forms/core/fesm2015/core.js");
/**
 * The DynamicFormArrayComponent is immutable (in that it doesn't provide options to dynamically resize). This component adds controls (add and delete buttons) to overcome this limitation.
 *
 * @export
 * @class FormMutableArrayComponent
 */
let FormMutableArrayComponent = class FormMutableArrayComponent extends core_2.DynamicFormArrayComponent {
    constructor(layoutService, validationService, formService) {
        super(layoutService, validationService);
        this.layoutService = layoutService;
        this.validationService = validationService;
        this.formService = formService;
        this.blur = new core_1.EventEmitter();
        this.change = new core_1.EventEmitter();
        this.customEvent = new core_1.EventEmitter();
        this.focus = new core_1.EventEmitter();
    }
    // From https://github.com/udos86/ng-dynamic-forms#form-arrays
    addItem() {
        this.formService.addFormArrayGroup(this.array, this.model);
    }
    removeItem(index) {
        this.formService.removeFormArrayGroup(index, this.array, this.model);
    }
    clear() {
        this.formService.clearFormArray(this.array, this.model);
    }
};
__decorate([
    core_1.Input(),
    __metadata("design:type", forms_1.FormGroup)
], FormMutableArrayComponent.prototype, "group", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Object)
], FormMutableArrayComponent.prototype, "layout", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", core_2.DynamicFormArrayModel)
], FormMutableArrayComponent.prototype, "model", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", core_1.QueryList)
], FormMutableArrayComponent.prototype, "templates", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], FormMutableArrayComponent.prototype, "blur", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], FormMutableArrayComponent.prototype, "change", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], FormMutableArrayComponent.prototype, "customEvent", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], FormMutableArrayComponent.prototype, "focus", void 0);
FormMutableArrayComponent = __decorate([
    core_1.Component({
        selector: "app-form-mutable-array",
        template: __webpack_require__(/*! ./form-mutable-array.component.html */ "./src/app/form/form-mutable-array/form-mutable-array.component.html"),
        styles: [__webpack_require__(/*! ./form-mutable-array.component.scss */ "./src/app/form/form-mutable-array/form-mutable-array.component.scss")]
    }),
    __metadata("design:paramtypes", [core_2.DynamicFormLayoutService,
        core_2.DynamicFormValidationService,
        core_2.DynamicFormService])
], FormMutableArrayComponent);
exports.FormMutableArrayComponent = FormMutableArrayComponent;


/***/ }),

/***/ "./src/app/form/form.component.html":
/*!******************************************!*\
  !*** ./src/app/form/form.component.html ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"root-form-container\" *ngIf=\"visible\">\n  <ng-content select=\".form-header\"></ng-content>\n\n  <div class=\"form-mode-dropdown-container\">\n    <p-dropdown\n      styleClass=\"form-mode-dropdown\"\n      *ngIf=\"availableFormModes.length > 1\"\n      [options]=\"availableFormModes\"\n      [(ngModel)]=\"formMode\"\n      (ngModelChange)=\"initAllFormGroups()\"\n      optionLabel=\"name\"\n    ></p-dropdown>\n  </div>\n\n  <div class=\"form-instance\">\n    <app-form-instance\n      [formSchema]=\"formSchema\"\n      *ngIf=\"formSchema !== undefined\"\n    ></app-form-instance>\n    <div\n      class=\"empty-placeholder\"\n      *ngIf=\"formSchema === undefined || formSchema === []\"\n    >\n      No form elements to display.\n    </div>\n  </div>\n\n  <div class=\"sidebar-padding sidebar-footer\">\n    <ng-content select=\".form-footer\"></ng-content>\n  </div>\n</div>\n"

/***/ }),

/***/ "./src/app/form/form.component.scss":
/*!******************************************!*\
  !*** ./src/app/form/form.component.scss ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".form-instance {\n  overflow-y: auto;\n  overflow-y: overlay;\n  -ms-overflow-style: -ms-autohiding-scrollbar;\n  overflow-x: hidden; }\n\n.root-form-container {\n  display: grid;\n  grid-template-columns: auto;\n  grid-template-rows: -webkit-min-content auto -webkit-min-content;\n  grid-template-rows: min-content auto min-content;\n  height: 100%;\n  max-width: 100vw;\n  min-width: 300px; }\n\nbody .ui-sidebar .root-form-container .form-header {\n  background-color: #ffffff; }\n\n.form-mode-dropdown-container {\n  position: absolute;\n  top: 28px;\n  right: 10px; }\n\n.form-mode-dropdown.ui-dropdown {\n  min-width: 0;\n  max-width: 150px;\n  background: none;\n  border: none;\n  font-size: 12px; }\n\n.form-mode-dropdown.ui-dropdown .ui-dropdown-label {\n  background: none; }\n\n.form-mode-dropdown.ui-dropdown .ui-dropdown-trigger {\n  background: none; }\n\n.form-mode-dropdown.ui-dropdown .ui-dropdown-panel {\n  right: 0;\n  left: unset !important; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYXdhbm1hY2Jvb2svRG9jdW1lbnRzL2Rzcy9jbGllbnQvc3JjL2FwcC9mb3JtL2Zvcm0uY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxnQkFBZ0I7RUFDaEIsbUJBQW1CO0VBQ25CLDRDQUE0QztFQUM1QyxrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxhQUFhO0VBQ2IsMkJBQTJCO0VBQzNCLGdFQUFnRDtFQUFoRCxnREFBZ0Q7RUFDaEQsWUFBWTtFQUNaLGdCQUFnQjtFQUNoQixnQkFBZ0IsRUFBQTs7QUFHbEI7RUFDRSx5QkFBeUIsRUFBQTs7QUFHM0I7RUFDRSxrQkFBa0I7RUFDbEIsU0FBUztFQUNULFdBQVcsRUFBQTs7QUFHYjtFQUNFLFlBQVk7RUFDWixnQkFBZ0I7RUFDaEIsZ0JBQWdCO0VBQ2hCLFlBQVk7RUFDWixlQUFlLEVBQUE7O0FBR2pCO0VBQ0UsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0UsZ0JBQWdCLEVBQUE7O0FBSWxCO0VBQ0UsUUFBUTtFQUNSLHNCQUFzQixFQUFBIiwiZmlsZSI6InNyYy9hcHAvZm9ybS9mb3JtLmNvbXBvbmVudC5zY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLmZvcm0taW5zdGFuY2Uge1xuICBvdmVyZmxvdy15OiBhdXRvO1xuICBvdmVyZmxvdy15OiBvdmVybGF5O1xuICAtbXMtb3ZlcmZsb3ctc3R5bGU6IC1tcy1hdXRvaGlkaW5nLXNjcm9sbGJhcjtcbiAgb3ZlcmZsb3cteDogaGlkZGVuO1xufVxuXG4ucm9vdC1mb3JtLWNvbnRhaW5lciB7XG4gIGRpc3BsYXk6IGdyaWQ7XG4gIGdyaWQtdGVtcGxhdGUtY29sdW1uczogYXV0bztcbiAgZ3JpZC10ZW1wbGF0ZS1yb3dzOiBtaW4tY29udGVudCBhdXRvIG1pbi1jb250ZW50O1xuICBoZWlnaHQ6IDEwMCU7XG4gIG1heC13aWR0aDogMTAwdnc7XG4gIG1pbi13aWR0aDogMzAwcHg7XG59XG5cbmJvZHkgLnVpLXNpZGViYXIgLnJvb3QtZm9ybS1jb250YWluZXIgLmZvcm0taGVhZGVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZmZmZjtcbn1cblxuLmZvcm0tbW9kZS1kcm9wZG93bi1jb250YWluZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogMjhweDtcbiAgcmlnaHQ6IDEwcHg7XG59XG5cbi5mb3JtLW1vZGUtZHJvcGRvd24udWktZHJvcGRvd24ge1xuICBtaW4td2lkdGg6IDA7XG4gIG1heC13aWR0aDogMTUwcHg7XG4gIGJhY2tncm91bmQ6IG5vbmU7XG4gIGJvcmRlcjogbm9uZTtcbiAgZm9udC1zaXplOiAxMnB4O1xufVxuXG4uZm9ybS1tb2RlLWRyb3Bkb3duLnVpLWRyb3Bkb3duIC51aS1kcm9wZG93bi1sYWJlbCB7XG4gIGJhY2tncm91bmQ6IG5vbmU7XG59XG5cbi5mb3JtLW1vZGUtZHJvcGRvd24udWktZHJvcGRvd24gLnVpLWRyb3Bkb3duLXRyaWdnZXIge1xuICBiYWNrZ3JvdW5kOiBub25lO1xufVxuXG4vLyBNYWtlIGRyb3Bkb3duIG1lbnUgYWxpZ24gcmlnaHQgaW5zdGVhZCBvZiBsZWZ0XG4uZm9ybS1tb2RlLWRyb3Bkb3duLnVpLWRyb3Bkb3duIC51aS1kcm9wZG93bi1wYW5lbCB7XG4gIHJpZ2h0OiAwO1xuICBsZWZ0OiB1bnNldCAhaW1wb3J0YW50O1xufVxuIl19 */"

/***/ }),

/***/ "./src/app/form/form.component.ts":
/*!****************************************!*\
  !*** ./src/app/form/form.component.ts ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const core_2 = __webpack_require__(/*! @ng-dynamic-forms/core */ "./node_modules/@ng-dynamic-forms/core/fesm2015/core.js");
const rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm2015/index.js");
const mergeOptions = __webpack_require__(/*! merge-options */ "./node_modules/merge-options/index.js");
const isPlainObject = __webpack_require__(/*! is-plain-obj */ "./node_modules/is-plain-obj/index.js");
const form_interfaces_1 = __webpack_require__(/*! ./form-interfaces */ "./src/app/form/form-interfaces.ts");
const get_form_validation_errors_1 = __webpack_require__(/*! ./get-form-validation-errors */ "./src/app/form/get-form-validation-errors.ts");
const config_service_1 = __webpack_require__(/*! ../services/config.service */ "./src/app/services/config.service.ts");
const auth_service_1 = __webpack_require__(/*! ../services/auth.service */ "./src/app/services/auth.service.ts");
/**
 * This is the 'root' Job Config form component - it wraps up all othe Form components. It also provides helper functions for setting/fetching form value, creating new forms.
 *
 * @export
 * @class JobConfigComponent
 */
let JobConfigComponent = class JobConfigComponent {
    constructor(formService, configService, authService) {
        this.formService = formService;
        this.configService = configService;
        this.authService = authService;
        this.visible = false;
        this.submitOnClose = false;
        this.submit = new core_1.EventEmitter();
        // Are form values valid (for all forms)
        this.isValid = false;
        this.valid = new core_1.EventEmitter();
        this.init = false;
        this.updatingFormValues = false;
        // Does the form need to be updated when next visible? (as form values aren't updated while it is invisible)
        this.updateFormValuesOnVisible = false;
        // Has the user made changes to form values?
        this.valuesChanged = false;
        // Find and update all (nested) formControls
        this.updateFormControlModelValues = (form, formModel, value) => {
            if (typeof value === "undefined") {
                return;
            }
            switch (formModel.type) {
                case core_2.DYNAMIC_FORM_CONTROL_TYPE_ARRAY:
                    // update FormArrayModels (as NgDynamic form will not automatically populate FormArrayModels)
                    this.updateFormArrayModelValues(form, formModel, value);
                    break;
                case core_2.DYNAMIC_FORM_CONTROL_TYPE_GROUP:
                    // update formGroup children
                    this.updateFormGroupModelValues(form, formModel, value);
                    break;
            }
        };
        this.updateFormGroupModelValues = (form, formModel, value) => {
            // For each element in the value array
            formModel.group.forEach(childFormControl => this.updateFormControlModelValues(form, childFormControl, value[childFormControl.id]));
        };
        this.updateFormArrayModelValues = (form, arrayFormModel, value) => {
            if (!Array.isArray(value)) {
                return;
            }
            // For each element in the value array
            value.forEach((valueElement, idx) => {
                // Get form group for the given index - and if it doesn't not exist, create it
                let arrayFormGroupModel = arrayFormModel.get(idx);
                if (typeof arrayFormGroupModel === "undefined") {
                    arrayFormGroupModel = arrayFormModel.insertGroup(idx);
                }
                // For each group model (each property/field in the Form Group) -> update the value
                arrayFormGroupModel.group.forEach(control => {
                    ;
                    control.valueUpdates.next(valueElement[control.id]);
                });
            });
            // Because we changed the formModel - we must recreate the form group
            this.createFormGroup(form);
        };
    }
    ngOnInit() {
        // If no formMode has been provided -> use default
        if (typeof this.formMode === "undefined") {
            this.formMode = this.form.defaultMode;
        }
        // Update form values when the subject values change
        this.subjectSubscription = this.subject.subscribe(values => {
            if (typeof values !== "undefined") {
                if (typeof this.form.subjectPropertyKey === "string") {
                    this.currentSubjectValues = values[this.form.subjectPropertyKey];
                }
                else {
                    this.currentSubjectValues = values;
                }
                if (!this.init) {
                    this.initAllFormGroups();
                }
                else {
                    this.updateFormValues();
                }
            }
        });
        // Submit form when the submitFormSubject is fired -> this allows submit to be fired outside of the component
        if (typeof this.submitFormSubject !== "undefined") {
            this.submitFormSubscription = this.submitFormSubject.subscribe(submit => {
                if (submit) {
                    this.submitForm();
                    this.submitFormSubject.next(false);
                }
            });
        }
    }
    ngAfterViewInit() { }
    ngOnDestroy() {
        if (typeof this.subjectSubscription !== "undefined") {
            this.subjectSubscription.unsubscribe();
        }
        if (typeof this.submitFormSubject !== "undefined") {
            this.submitFormSubscription.unsubscribe();
        }
        this.clearFormGroups();
    }
    ngOnChanges(changes) {
        if (this.init) {
            if ("visible" in changes) {
                // If visible and updateFormValuesOnVisible -> updateFormValues
                if (changes.visible.currentValue === true) {
                    if (this.updateFormValuesOnVisible) {
                        this.updateFormValues();
                    }
                    // On jobConfig hide -> submit the form if changes have occurred
                }
                else if (this.submitOnClose &&
                    changes.visible.previousValue === true &&
                    this.valuesChanged) {
                    this.submitForm();
                }
            }
            if ("form" in changes || "formMode" in changes) {
                this.initAllFormGroups();
            }
        }
    }
    submitForm() {
        if (typeof this.currentSubjectValues !== "undefined") {
            let newSubject;
            if (typeof this.form.subjectPropertyKey === "string") {
                newSubject = this.subject.getValue();
                newSubject[this.form.subjectPropertyKey] = this.currentSubjectValues;
            }
            else {
                newSubject = this.currentSubjectValues;
            }
            this.subject.next(newSubject);
            this.submit.emit({ values: newSubject });
        }
    }
    // call function on every form instance in the given formSchema
    forEachForm(fn, formSchema = this.formSchema) {
        if (!Array.isArray(formSchema)) {
            return;
        }
        formSchema.forEach((formSchemaChild, index, array) => {
            if (Array.isArray(formSchemaChild.form)) {
                this.forEachForm(fn, formSchemaChild.form);
            }
            else {
                fn(formSchemaChild.form, formSchemaChild, index, array);
            }
        });
    }
    filterFormSchema(fn, formSchema = this.formSchema) {
        const filteredFormSchema = formSchema.filter(fn);
        filteredFormSchema.forEach((form, index) => {
            if (Array.isArray(form.form)) {
                filteredFormSchema[index].form = this.filterFormSchema(fn, form.form);
            }
        });
        return filteredFormSchema;
    }
    initAllFormGroups() {
        if (typeof this.form.schemaFactory === "function") {
            this.formSchema = this.form.schemaFactory(this.formMode, this.configService);
        }
        else {
            this.formSchema = this.form.schemaFactory;
        }
        // Filter formSchema based on form mode and corresponding user roles
        this.formSchema = this.filterFormSchema(formSchema => formSchema.modeKeys.includes(this.formMode.key) &&
            this.formMode.userRoles.includes(this.authService.userRole));
        if (this.configService.debugMode) {
            console.log(this.formSchema);
        }
        // Update available form modes based on user role of logged in user
        if (this.authService.isLoggedIn) {
            this.availableFormModes = this.form.modes.filter(mode => mode.userRoles.includes(this.authService.userRole));
        }
        else {
            this.availableFormModes = [];
        }
        // For each form in tree -> check current formMode (and corresponding user roles) and hide forms which don't apply
        this.forEachForm((form, formSchema, currentIndex, currentArray) => {
            if (formSchema.modeKeys.includes(this.formMode.key) &&
                this.formMode.userRoles.includes(this.authService.userRole)) {
                this.createFormGroup(form);
            }
            else {
                currentArray.splice(currentIndex, 1);
            }
        });
        // UpdateFormValues must come after setting init = true
        this.init = true;
        this.updateFormValues();
    }
    createFormGroup(form) {
        form.formGroup = this.formService.createFormGroup(form.model);
        form.savingValuesChanges = false;
        form.valueChangeSub = form.formGroup.valueChanges.subscribe(values => {
            // If form is visible -> Update now
            if (this.visible) {
                this.saveFormValues(form, values);
                // Else -> mark for update when form is visible
            }
            else {
                this.updateFormValuesOnVisible = true;
            }
        });
    }
    clearFormGroups() {
        this.forEachForm((form, formSchema) => {
            if (typeof form.valueChangeSub !== "undefined") {
                form.valueChangeSub.unsubscribe();
            }
        });
    }
    updateFormValidation() {
        let isValid = true;
        this.forEachForm((form, formSchema) => {
            if (typeof form.formGroup !== "undefined" && form.formGroup.invalid) {
                if (this.configService.debugMode) {
                    console.log("INVALID");
                    console.log(form.formGroup.controls);
                    console.log(get_form_validation_errors_1.getFormValidationErrors(form.formGroup.controls));
                }
                isValid = false;
            }
        });
        this.isValid = isValid;
        this.valid.emit(isValid);
    }
    saveFormValues(form, values) {
        if (typeof this.currentSubjectValues !== "undefined" &&
            this.init &&
            !this.updatingFormValues &&
            !form.savingValuesChanges) {
            form.savingValuesChanges = true;
            this.valuesChanged = true;
            // Mark config is Valid if all form groups are valid
            this.updateFormValidation();
            // If *the current* form group is valid -> assign values to currentJob
            if (form.formGroup.valid) {
                Object.keys(values).forEach(key => {
                    // Fix arrays - a NgDynamicForms will changes array keys to strings (resulting in an Object)
                    if (Array.isArray(this.currentSubjectValues[key]) &&
                        !Array.isArray(values[key])) {
                        values[key] = Object.values(values[key]);
                    }
                });
                // Merge value into currentJob
                Object.keys(values).forEach(key => {
                    if (isPlainObject(values[key])) {
                        if (typeof this.currentSubjectValues[key] !== "undefined" &&
                            this.currentSubjectValues[key] !== null) {
                            this.currentSubjectValues[key] = mergeOptions(this.currentSubjectValues[key], values[key]);
                        }
                        else {
                            this.currentSubjectValues[key] = values[key];
                        }
                    }
                    else {
                        this.currentSubjectValues[key] = values[key];
                    }
                });
            }
            form.savingValuesChanges = false;
        }
    }
    updateFormValues() {
        if (typeof this.currentSubjectValues !== "undefined" &&
            this.init &&
            !this.updatingFormValues) {
            this.updatingFormValues = true;
            try {
                // We have to 'resolve' subject getters/setters as they don't work with NgDynamicForms
                this.forEachForm((form, formSchema) => {
                    // Update Form control models before patching values (eg pre populate form array groups)
                    form.model.forEach(currentFormModel => this.updateFormControlModelValues(form, currentFormModel, this.currentSubjectValues[currentFormModel.id]));
                    form.formGroup.patchValue(
                    // Create an object with the subject properties that are needed for the given form
                    form.model.reduce((jobResolvedProperties, currentFormModel) => {
                        const value = this.currentSubjectValues[currentFormModel.id];
                        if (typeof value !== "undefined") {
                            jobResolvedProperties[currentFormModel.id] = value;
                        }
                        return jobResolvedProperties;
                    }, {}));
                });
            }
            catch (error) {
                console.log(error);
            }
            this.updateFormValidation();
            this.updateFormValuesOnVisible = false;
            this.updatingFormValues = false;
        }
    }
};
__decorate([
    core_1.Input(),
    __metadata("design:type", Boolean)
], JobConfigComponent.prototype, "visible", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Boolean)
], JobConfigComponent.prototype, "submitOnClose", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", form_interfaces_1.FormRootModel)
], JobConfigComponent.prototype, "form", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Object)
], JobConfigComponent.prototype, "formMode", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", rxjs_1.BehaviorSubject)
], JobConfigComponent.prototype, "subject", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", rxjs_1.Subject)
], JobConfigComponent.prototype, "submitFormSubject", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], JobConfigComponent.prototype, "submit", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], JobConfigComponent.prototype, "valid", void 0);
JobConfigComponent = __decorate([
    core_1.Component({
        selector: "app-form",
        template: __webpack_require__(/*! ./form.component.html */ "./src/app/form/form.component.html"),
        encapsulation: core_1.ViewEncapsulation.None,
        styles: [__webpack_require__(/*! ./form.component.scss */ "./src/app/form/form.component.scss")]
    }),
    __metadata("design:paramtypes", [core_2.DynamicFormService,
        config_service_1.ConfigService,
        auth_service_1.AuthService])
], JobConfigComponent);
exports.JobConfigComponent = JobConfigComponent;


/***/ }),

/***/ "./src/app/form/get-form-validation-errors.ts":
/*!****************************************************!*\
  !*** ./src/app/form/get-form-validation-errors.ts ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// Adapted from https://stackoverflow.com/a/46080244
Object.defineProperty(exports, "__esModule", { value: true });
const forms_1 = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm2015/forms.js");
function getFormValidationErrors(controls) {
    let errors = [];
    Object.keys(controls).forEach(key => {
        const control = controls[key];
        if (control instanceof forms_1.FormGroup) {
            errors = errors.concat(getFormValidationErrors(control.controls));
        }
        const controlErrors = controls[key].errors;
        if (controlErrors !== null) {
            Object.keys(controlErrors).forEach(keyError => {
                errors.push({
                    control_name: key,
                    error_name: keyError,
                    error_value: controlErrors[keyError],
                });
            });
        }
    });
    return errors;
}
exports.getFormValidationErrors = getFormValidationErrors;


/***/ }),

/***/ "./src/app/form/monaco-editor/code-editor-model.ts":
/*!*********************************************************!*\
  !*** ./src/app/form/monaco-editor/code-editor-model.ts ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @ng-dynamic-forms/core */ "./node_modules/@ng-dynamic-forms/core/fesm2015/core.js");
const mergeOptions = __webpack_require__(/*! ../../../../node_modules/merge-options */ "./node_modules/merge-options/index.js");
exports.DYNAMIC_FORM_CONTROL_TYPE_CODE_EDITOR = "CODE_EDITOR";
exports.dynamicCodeEditorConfigDefaults = {
    wordWrap: "on",
    language: "cpp",
    fontSize: 12,
    scrollBeyondLastLine: false,
};
/**
 * DynamicInputControlModel for the Monaco code editor
 *
 * @export
 * @class DynamicCodeEditorModel
 */
class DynamicCodeEditorModel extends core_1.DynamicInputControlModel {
    constructor(config, layout) {
        super(config, layout);
        this.type = exports.DYNAMIC_FORM_CONTROL_TYPE_CODE_EDITOR;
        this.options = mergeOptions(exports.dynamicCodeEditorConfigDefaults, config.options || {});
        // This is needed so the monaco assets are loaded from the correct location
        this.options.baseUrl = "./assets";
    }
}
__decorate([
    core_1.serializable(),
    __metadata("design:type", Object)
], DynamicCodeEditorModel.prototype, "options", void 0);
__decorate([
    core_1.serializable(),
    __metadata("design:type", String)
], DynamicCodeEditorModel.prototype, "type", void 0);
exports.DynamicCodeEditorModel = DynamicCodeEditorModel;


/***/ }),

/***/ "./src/app/form/monaco-editor/form-monaco-editor.component.html":
/*!**********************************************************************!*\
  !*** ./src/app/form/monaco-editor/form-monaco-editor.component.html ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<ng-container [formGroup]=\"group\">\n  <ngx-monaco-editor\n    class=\"code-editor\"\n    [formControlName]=\"model.id\"\n    [ngClass]=\"[getClass('element', 'control'), getClass('grid', 'control')]\"\n    (blur)=\"onBlur($event)\"\n    (change)=\"onChange($event)\"\n    (focus)=\"onFocus($event)\"\n    [(options)]=\"model.options\"\n    #codeEditor\n  >\n  </ngx-monaco-editor>\n  <app-spinner [spinnerTarget]=\"'dynamic-code-editor-component'\"></app-spinner>\n</ng-container>\n"

/***/ }),

/***/ "./src/app/form/monaco-editor/form-monaco-editor.component.scss":
/*!**********************************************************************!*\
  !*** ./src/app/form/monaco-editor/form-monaco-editor.component.scss ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".monaco-aria-container {\n  position: absolute;\n  left: -999em;\n  top: 0;\n  z-index: 1500; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYXdhbm1hY2Jvb2svRG9jdW1lbnRzL2Rzcy9jbGllbnQvc3JjL2FwcC9mb3JtL21vbmFjby1lZGl0b3IvZm9ybS1tb25hY28tZWRpdG9yLmNvbXBvbmVudC5zY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0Usa0JBQWtCO0VBQ2xCLFlBQVk7RUFDWixNQUFNO0VBQ04sYUFBYSxFQUFBIiwiZmlsZSI6InNyYy9hcHAvZm9ybS9tb25hY28tZWRpdG9yL2Zvcm0tbW9uYWNvLWVkaXRvci5jb21wb25lbnQuc2NzcyIsInNvdXJjZXNDb250ZW50IjpbIi5tb25hY28tYXJpYS1jb250YWluZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGxlZnQ6IC05OTllbTtcbiAgdG9wOiAwO1xuICB6LWluZGV4OiAxNTAwOyAvLyBTYW1lIGFzIGRpYWxvZ3Ncbn1cbiJdfQ== */"

/***/ }),

/***/ "./src/app/form/monaco-editor/form-monaco-editor.component.ts":
/*!********************************************************************!*\
  !*** ./src/app/form/monaco-editor/form-monaco-editor.component.ts ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const forms_1 = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm2015/forms.js");
const core_2 = __webpack_require__(/*! @ng-dynamic-forms/core */ "./node_modules/@ng-dynamic-forms/core/fesm2015/core.js");
const ngx_monaco_editor_1 = __webpack_require__(/*! ngx-monaco-editor */ "./node_modules/ngx-monaco-editor/fesm2015/ngx-monaco-editor.js");
const code_editor_model_1 = __webpack_require__(/*! ./code-editor-model */ "./src/app/form/monaco-editor/code-editor-model.ts");
const spinner_service_service_1 = __webpack_require__(/*! src/app/spinner/spinner-service.service */ "./src/app/spinner/spinner-service.service.ts");
/**
 * DynamicFormControlComponent for the Monaco code editor.
 *
 * @export
 * @class DynamicCodeEditorComponent
 */
let DynamicCodeEditorComponent = class DynamicCodeEditorComponent extends core_2.DynamicFormControlComponent {
    constructor(layoutService, validationService, spinnerService) {
        super(layoutService, validationService);
        this.layoutService = layoutService;
        this.validationService = validationService;
        this.spinnerService = spinnerService;
        this.blur = new core_1.EventEmitter();
        this.change = new core_1.EventEmitter();
        this.customEvent = new core_1.EventEmitter();
        this.focus = new core_1.EventEmitter();
    }
    ngOnInit() {
        this.spinnerService.setSpinner("dynamic-code-editor-component-loading", {
            target: "dynamic-code-editor-component",
            icon: spinner_service_service_1.SpinnerIcon.Ball8Bit,
            name: "Loading editor..",
        });
    }
    ngAfterViewInit() {
        this.codeEditorInitSubscription = this.codeEditor.onInit.subscribe(() => {
            this.spinnerService.removeSpinner("dynamic-code-editor-component-loading");
        });
    }
    ngOnDestroy() {
        this.codeEditorInitSubscription.unsubscribe();
    }
};
__decorate([
    core_1.Input(),
    __metadata("design:type", forms_1.FormGroup)
], DynamicCodeEditorComponent.prototype, "group", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Object)
], DynamicCodeEditorComponent.prototype, "layout", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", code_editor_model_1.DynamicCodeEditorModel)
], DynamicCodeEditorComponent.prototype, "model", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], DynamicCodeEditorComponent.prototype, "blur", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], DynamicCodeEditorComponent.prototype, "change", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], DynamicCodeEditorComponent.prototype, "customEvent", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], DynamicCodeEditorComponent.prototype, "focus", void 0);
__decorate([
    core_1.ViewChild("codeEditor"),
    __metadata("design:type", ngx_monaco_editor_1.EditorComponent)
], DynamicCodeEditorComponent.prototype, "codeEditor", void 0);
DynamicCodeEditorComponent = __decorate([
    core_1.Component({
        selector: "app-form-monaco-editor",
        template: __webpack_require__(/*! ./form-monaco-editor.component.html */ "./src/app/form/monaco-editor/form-monaco-editor.component.html"),
        changeDetection: core_1.ChangeDetectionStrategy.OnPush,
        encapsulation: core_1.ViewEncapsulation.None,
        styles: [__webpack_require__(/*! ./form-monaco-editor.component.scss */ "./src/app/form/monaco-editor/form-monaco-editor.component.scss")]
    }),
    __metadata("design:paramtypes", [core_2.DynamicFormLayoutService,
        core_2.DynamicFormValidationService,
        spinner_service_service_1.SpinnerService])
], DynamicCodeEditorComponent);
exports.DynamicCodeEditorComponent = DynamicCodeEditorComponent;


/***/ }),

/***/ "./src/app/geo-web/geoweb.component.html":
/*!***********************************************!*\
  !*** ./src/app/geo-web/geoweb.component.html ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"geoweb-container\"\n  #geowebContainer>\n  <app-file-drop-upload dropZoneClassName=\"fullscreen-file-drop-upload\">\n\n    <app-spinner spinnerTarget=\"file-drop-upload\"\n      [fullScreenOverlay]=\"true\"\n      zIndex=\"1990\"></app-spinner>\n    <app-spinner [fullScreenOverlay]=\"true\"></app-spinner>\n    <app-file-browser></app-file-browser>\n\n    <div id=\"connection-status\"\n      [ngClass]=\"wsConnected ? 'connected' : 'disconnected'\">\n      {{ wsConnected ? \"connected\" : \"connecting...\" }}\n    </div>\n    <app-map></app-map>\n\n    <p-slideMenu #mainMenu\n      [model]=\"menuItems\"\n      [popup]=\"true\"\n      appendTo=\"body\"\n      styleClass=\"geoweb-menu\"\n      baseZIndex=\"1300\"\n      viewportHeight=\"197\"\n      effectDuration=\"150\"\n      showTransitionOptions=\"150ms ease-out\"\n      hideTransitionOptions=\"150ms ease-in\"></p-slideMenu>\n    <div id=\"top-left-controls\">\n      <div class=\"fake-leaflet-control-lg\">\n        <a title=\"Show Menu\"\n          (click)=\"mainMenu.toggle($event)\">\n          <fa-icon [icon]=\"['fas', 'bars']\"></fa-icon>\n        </a>\n      </div>\n\n      <div class=\"fake-leaflet-control-lg\"\n        *ngIf=\"currentJob === undefined\"\n        [hidden]=\"mainMenu.visible\">\n        <a title=\"Get job\"\n          (click)=\"showGetJobDialog()\">\n          <fa-icon [icon]=\"['fas', 'folder-open']\"></fa-icon>\n        </a>\n      </div>\n\n      <div class=\"fake-leaflet-control-lg\"\n        *ngIf=\"currentJob !== undefined && !currentJob.clientOnly\"\n        [hidden]=\"mainMenu.visible\">\n        <a title=\"Run Simulation\"\n          (click)=\"runJob()\"\n          *ngIf=\"\n            currentJob.status !== 'RUNNING' && currentJob.status !== 'QUEUED'\n          \">\n          <fa-icon [icon]=\"['fas', 'play']\"></fa-icon>\n        </a>\n        <a title=\"Stop Simulation\"\n          (click)=\"stopJob()\"\n          *ngIf=\"\n            currentJob.status === 'RUNNING' || currentJob.status === 'QUEUED'\n          \">\n          <fa-icon [icon]=\"['fas', 'stop']\"></fa-icon>\n        </a>\n      </div>\n    </div>\n\n    <div class=\"command-textbox-container\"\n      [hidden]=\"!showCommandTextbox\">\n      <input type=\"text\"\n        id=\"command-textbox\"\n        placeholder=\"Commands: get-job <job-name>, new-job <job-name> <template-name>\" />\n    </div>\n\n    <p-dialog header=\"New Job\"\n      [(visible)]=\"newJobDialogVisible\"\n      modal=\"true\"\n      styleClass=\"modal-dialog\"\n      [closeOnEscape]=\"false\"\n      [draggable]=\"false\"\n      [resizable]=\"false\"\n      (keyup)=\"onKeypress($event, 'Enter', submitNewJobDialog.bind(this))\"\n      #newJobDialog>\n      <div class=\"ui-grid ui-grid-responsive ui-fluid\">\n        <div class=\"ui-grid-row\">\n          <div class=\"ui-grid-col-12\">\n            <span class=\"label\">Name</span>\n            <input type=\"text\"\n              pInputText\n              placeholder=\"Name\"\n              [(ngModel)]=\"newJob.name\"\n              required\n              [customValidator]=\"\n                customFormValidators.alphaNumericDashesValidator\n              \"\n              #newJobNameInput=\"ngModel\" />\n            <ul *ngIf=\"newJobNameInput.touched && newJobNameInput.errors\">\n              <li *ngIf=\"newJobNameInput.errors.customValidator\"\n                class=\"ui-message ui-messages-error\">\n                {{\n                  customFormValidators.alphaNumericDashesValidator.errorMessage\n                }}\n              </li>\n              <li *ngIf=\"newJobNameInput.errors.required\"\n                class=\"ui-message ui-messages-error\">\n                A job name is required\n              </li>\n            </ul>\n          </div>\n        </div>\n\n        <div class=\"ui-grid-row\">\n          <div class=\"ui-grid-col-12\">\n            <span class=\"label\">Type</span>\n\n            <p-dropdown [options]=\"availableJobTypes\"\n              [(ngModel)]=\"newJobSelectedJobType\"\n              optionLabel=\"value.label\"\n              [autoDisplayFirst]=\"false\"\n              [required]=\"true\">\n            </p-dropdown>\n          </div>\n        </div>\n\n        <div class=\"ui-grid-row\">\n          <div class=\"ui-grid-col-12\">\n            <span class=\"label\">Template<a title=\"Refresh List\"\n                (click)=\"updateJobLists()\"\n                style=\"float:right\">\n                <fa-icon [icon]=\"['fas', 'sync']\"></fa-icon>\n              </a></span>\n            <p-listbox [options]=\"availableJobTemplates\"\n              [(ngModel)]=\"newJobSelectedJobTemplate\">\n              <ng-template let-jobTemplate\n                let-i=\"index\"\n                pTemplate=\"item\">\n                <div class=\"ui-helper-clearfix\">\n                  {{ jobTemplate.value.name\n                  }}<b>\n                    {{ jobTemplate.value.type }}\n                  </b>\n                </div>\n              </ng-template>\n            </p-listbox>\n          </div>\n        </div>\n      </div>\n      <p-footer>\n        <button type=\"button\"\n          pButton\n          icon=\"pi pi-times\"\n          (click)=\"cancelNewJobDialog()\"\n          label=\"Cancel\"\n          class=\"ui-button-secondary\"></button>\n        <button type=\"button\"\n          pButton\n          icon=\"pi pi-check\"\n          (click)=\"submitNewJobDialog(); newJobNameInput.reset()\"\n          label=\"Create Job\"\n          [disabled]=\"newJobNameInput.errors\"></button>\n      </p-footer>\n    </p-dialog>\n\n    <p-dialog header=\"Load Job\"\n      [(visible)]=\"getJobDialogVisible\"\n      modal=\"true\"\n      styleClass=\"modal-dialog\"\n      [closeOnEscape]=\"false\"\n      [draggable]=\"false\"\n      [resizable]=\"false\"\n      (keyup)=\"onKeypress($event, 'Enter', submitGetJobDialog.bind(this))\"\n      #getJobDialog>\n      <div class=\"ui-grid ui-grid-responsive ui-fluid\">\n        <div class=\"ui-grid-row\">\n          <div class=\"ui-grid-col-12\">\n            <span class=\"label\">Jobs<a title=\"Refresh List\"\n                (click)=\"updateJobLists()\"\n                style=\"float:right\">\n                <fa-icon [icon]=\"['fas', 'sync']\"></fa-icon>\n              </a></span>\n            <div class=\"empty-placeholder\"\n              *ngIf=\"availableJobs.length === 0\">\n              No jobs available.\n            </div>\n            <p-listbox *ngIf=\"availableJobs.length > 0\"\n              [options]=\"availableJobs\"\n              [(ngModel)]=\"getJobSelectedJob\"\n              styleClass=\"load-job-list\"\n              (keyup)=\"onKeypress($event, 'Enter', submitGetJobDialog.bind(this))\">\n              <ng-template let-availableJob\n                let-i=\"index\"\n                pTemplate=\"item\">\n                <span>{{ availableJob.value.name\n                  }}<b>\n                    {{ availableJob.value.type }}\n                  </b>\n                  <span class=\"font-italic-light\"\n                    *ngIf=\"debugMode\">\n                    {{ availableJob.value.status }}\n                  </span></span>\n\n                <span>\n                  <p-progressBar [value]=\"availableJob.value.progress\"\n                    *ngIf=\"debugMode && availableJob.value.status === 'RUNNING'\"></p-progressBar>\n                </span>\n                <span>\n                  <span *ngIf=\"isAdmin\">\n                    <a title=\"Run Job\"\n                      (click)=\"runJob(availableJob.value.name)\"\n                      class=\"icon-link\"\n                      *ngIf=\"\n                        !(\n                          availableJob.value.status === 'STARTING' ||\n                          availableJob.value.status === 'QUEUED' ||\n                          availableJob.value.status === 'RUNNING'\n                        )\n                      \">\n                      <fa-icon [icon]=\"['fas', 'play']\"\n                        class=\"icon-link\"></fa-icon>\n                    </a>\n                    <a title=\"Stop Job\"\n                      (click)=\"stopJob(availableJob.value.name)\"\n                      class=\"icon-link\"\n                      *ngIf=\"\n                        availableJob.value.status === 'STARTING' ||\n                        availableJob.value.status === 'QUEUED' ||\n                        availableJob.value.status === 'RUNNING'\n                      \">\n                      <fa-icon [icon]=\"['fas', 'stop']\"></fa-icon>\n                    </a>\n                    <a title=\"Delete Job\"\n                      class=\"icon-link\"\n                      (click)=\"deleteJob(availableJob.value.name)\"\n                      disabled>\n                      <fa-icon [icon]=\"['fas', 'trash']\"></fa-icon>\n                    </a>\n                  </span>\n                  <span class=\"badge\">\n                    <fa-icon [icon]=\"['fas', 'users']\"\n                      style=\"padding-right: 5px\"></fa-icon>{{ availableJob.value.connectedUsers }}\n                  </span>\n                </span>\n              </ng-template>\n            </p-listbox>\n          </div>\n        </div>\n      </div>\n\n      <p-footer>\n        <button type=\"button\"\n          pButton\n          icon=\"pi pi-times\"\n          (click)=\"cancelGetJobDialog()\"\n          label=\"Cancel\"\n          class=\"ui-button-secondary\"></button>\n        <button type=\"button\"\n          pButton\n          icon=\"pi pi-check\"\n          (click)=\"submitGetJobDialog()\"\n          label=\"Load Job\"\n          [disabled]=\"getJobSelectedJob === undefined\"></button>\n      </p-footer>\n    </p-dialog>\n\n    <p-sidebar [(visible)]=\"showConfigController\"\n      position=\"left\"\n      [modal]=\"false\"\n      styleClass=\"width-fit-content\"\n      *ngIf=\"\n        currentJob !== undefined && currentJob.inputFormModel !== undefined\n      \">\n      <app-form [(visible)]=\"showConfigController\"\n        [form]=\"currentJob.inputFormModel\"\n        [formMode]=\"currentJob.inputFormModel.defaultMode\"\n        [subject]=\"jobSubject\"\n        (valid)=\"jobConfigFormIsValid = $event\"\n        [submitOnClose]=\"true\">\n        <div class=\"form-header\">\n          <h1>\n            {{ jobTypeDescriptionsMap[currentJob.type].label }}:&nbsp;<span\n              class=\"font-italic-light\">{{ currentJob.name }}</span>\n          </h1>\n        </div>\n        <div class=\"form-footer\">\n          <button type=\"button\"\n            pButton\n            icon=\"pi pi-caret-right\"\n            iconPos=\"right\"\n            label=\"Run Simulation\"\n            (click)=\"runJob()\"\n            [disabled]=\"!jobConfigFormIsValid || currentJob.clientOnly\"\n            style=\"float:right;\"></button>\n        </div>\n      </app-form>\n    </p-sidebar>\n\n    <p-sidebar [(visible)]=\"showLoggingController\"\n      position=\"left\"\n      [modal]=\"false\"\n      styleClass=\"log-sidebar\"\n      *ngIf=\"currentJob !== undefined\">\n      <h1>Logs</h1>\n\n      <div class=\"sidebar-container sidebar-padding log-messages-container\"\n        *ngIf=\"showLoggingController\">\n        <p *ngFor=\"let log of logs; let i = index\"\n          class=\"log-message\">\n          <b>{{ logs[logs.length - i - 1].name }} ({{\n              logs[logs.length - i - 1].type\n            }}):</b>\n          {{ logs[logs.length - i - 1].output }}\n        </p>\n\n        <br /><br />\n      </div>\n\n      <br />\n\n      <p-button label=\"Download Logs\"\n        icon=\"pi pi-download\"\n        iconPos=\"right\"\n        styleClass=\"ui-button-secondary\"\n        (click)=\"downloadUrl(getMasterJobFilesUrl() + currentJob.logFilePath)\"\n        pTooltip=\"Tab-delimited text file\"\n        tooltipPosition=\"top\"\n        tooltipZIndex=\"1400\"\n        style=\"float: left;\"></p-button>\n\n      <p-button icon=\"pi pi-times\"\n        iconPos=\"right\"\n        label=\"Clear\"\n        (click)=\"jobService.clearLogs()\"\n        styleClass=\"log-clear-button\"\n        style=\"float: right;\"></p-button>\n    </p-sidebar>\n\n    <p-sidebar [(visible)]=\"showServerConfigController\"\n      position=\"left\"\n      [modal]=\"false\"\n      styleClass=\"width-fit-content\"\n      *ngIf=\"serverConfigSubject !== undefined\">\n      <app-form [(visible)]=\"showServerConfigController\"\n        [form]=\"serverConfigForm\"\n        [subject]=\"serverConfigSubject\"\n        [submitFormSubject]=\"serverConfigFormSubmitSubject\"\n        (valid)=\"serverConfigFormIsValid = $event\"\n        (submit)=\"updateServerConfig($event)\">\n        <div class=\"form-header\">\n          <h1>Server Config</h1>\n        </div>\n        <div class=\"form-footer\">\n          <button type=\"button\"\n            pButton\n            icon=\"pi pi-caret-right\"\n            iconPos=\"right\"\n            label=\"Save\"\n            (click)=\"serverConfigFormSubmitSubject.next(true)\"\n            [disabled]=\"!serverConfigFormIsValid\"\n            style=\"float:right;\"></button>\n        </div>\n      </app-form>\n    </p-sidebar>\n  </app-file-drop-upload>\n</div>"

/***/ }),

/***/ "./src/app/geo-web/geoweb.component.scss":
/*!***********************************************!*\
  !*** ./src/app/geo-web/geoweb.component.scss ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".fake-leaflet-control,\n.fake-leaflet-control-lg,\n.fake-leaflet-control-colours,\nbody .ui-sidebar,\n#connection-status,\nbody .geoweb-menu.ui-slidemenu {\n  color: #333;\n  background: #fff;\n  border-radius: 4px;\n  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);\n  border: none;\n  background-clip: padding-box; }\n\n.fake-leaflet-control.active,\n.fake-leaflet-control-lg.active,\n.fake-leaflet-control-colours.active,\nbody .active.ui-sidebar,\n.active#connection-status,\nbody .active.geoweb-menu.ui-slidemenu {\n  background-color: #007ad9;\n  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);\n  color: #ffffff; }\n\n.fake-leaflet-control,\n.fake-leaflet-control-lg {\n  margin-bottom: 10px;\n  position: relative; }\n\n.fake-leaflet-control {\n  height: 30px;\n  width: 30px; }\n\n.fake-leaflet-control-lg {\n  height: 44px;\n  width: 44px; }\n\n.fake-leaflet-control a,\n.fake-leaflet-control-lg a {\n  color: inherit;\n  height: 100%;\n  width: 100%;\n  display: block;\n  line-height: 0; }\n\n.fake-leaflet-control:hover,\n.fake-leaflet-control-lg:hover {\n  background-color: #f4f4f4; }\n\n.fake-leaflet-control a:hover,\n.fake-leaflet-control-lg a:hover {\n  color: #333;\n  cursor: pointer; }\n\n.fake-leaflet-control.active:hover,\n.fake-leaflet-control-lg.active:hover {\n  background-color: #1775bd; }\n\n.fake-leaflet-control.active a:hover,\n.fake-leaflet-control-lg.active a:hover,\n.fake-leaflet-control-colours.active a:hover,\nbody .active.ui-sidebar a:hover,\n.active#connection-status a:hover,\nbody .active.geoweb-menu.ui-slidemenu a:hover {\n  color: #ffffff; }\n\n.fake-leaflet-control fa-icon.ng-fa-icon,\n.fake-leaflet-control-lg fa-icon.ng-fa-icon {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%); }\n\n.fake-leaflet-control a {\n  font-size: 12px; }\n\n.fake-leaflet-control-lg a {\n  font-size: 24px; }\n\n.fake-leaflet-control-lg span {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%); }\n\n* {\n  box-sizing: border-box; }\n\nbody,\nhtml {\n  font-family: Roboto, \"Helvetica Neue\", Helvetica, Arial, sans-serif !important;\n  font-size: 14px;\n  margin: 0;\n  padding: 0; }\n\n.c3 text {\n  font-family: Roboto, \"Helvetica Neue\", Helvetica, Arial, sans-serif !important;\n  font-size: 14px; }\n\nh1,\n.h1 {\n  font-size: 24px;\n  font-weight: 600; }\n\nh2,\n.h2 {\n  font-size: 18px;\n  font-weight: 500; }\n\npre {\n  word-break: break-word;\n  overflow-x: auto;\n  white-space: pre-wrap;\n  white-space: -moz-pre-wrap;\n  white-space: -pre-wrap;\n  white-space: -o-pre-wrap;\n  word-wrap: break-word; }\n\n.font-italic-light {\n  font-weight: 100;\n  font-style: italic; }\n\n.text-overflow-ellipsis {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis; }\n\n.label,\nlabel {\n  display: block;\n  margin-bottom: 10px;\n  margin-top: 20px; }\n\n.badge > .pi {\n  padding-right: 4px; }\n\na.icon-link:last-of-type {\n  padding-right: 10px; }\n\na.icon-link:first-of-type {\n  padding-left: 10px; }\n\na.icon-link {\n  font-size: 0.85em;\n  padding: 0 5px; }\n\nbody .ui-widget-overlay {\n  background-color: rgba(0, 0, 0, 0.2);\n  transition: all linear 0.2s; }\n\n.ui-state-highlight a.icon-link {\n  color: #ffffff; }\n\n.ui-state-highlight a.icon-link:hover {\n  color: #ffffffba; }\n\n.empty-placeholder {\n  color: #999;\n  font-weight: 100;\n  padding: 20px 0;\n  /* height: 100%; */\n  text-align: center; }\n\n.ui-toast {\n  max-height: 100vh;\n  overflow-y: auto; }\n\n.ui-toast-detail {\n  word-break: break-word; }\n\n.modal-dialog.ui-dialog {\n  width: 400px; }\n\n.ui-dialog .ui-grid .ui-grid-row {\n  margin-bottom: 10px; }\n\n.ui-dialog .ui-listbox .ui-listbox-list-wrapper {\n  max-height: calc(100vh - 400px);\n  min-height: 100px; }\n\nbody .ui-dialog .ui-dialog-content {\n  max-height: calc(100vh - 200px);\n  min-height: 200px;\n  overflow-y: auto;\n  overflow-y: overlay;\n  -ms-overflow-style: -ms-autohiding-scrollbar;\n  border-left: none;\n  border-right: none; }\n\nbody .ui-dialog .ui-dialog-titlebar,\nbody .ui-dialog .ui-dialog-footer {\n  border-left: none;\n  border-right: none; }\n\nbody .ui-dialog .ui-dialog-titlebar {\n  border-top: none; }\n\nbody .ui-dialog .ui-dialog-footer {\n  border-bottom: none; }\n\n.ui-dialog .ui-listbox .ui-progressbar {\n  display: inline-block;\n  width: 100%;\n  height: 14px;\n  margin-top: 3px;\n  margin-bottom: -3px;\n  background-color: #0000004a; }\n\n.ui-dialog .ui-listbox .ui-progressbar .ui-progressbar-label {\n  font-size: 12px;\n  line-height: 1.25;\n  color: inherit; }\n\n.ui-dialog .ui-listbox .ui-progressbar .ui-progressbar-value {\n  background: #0000006b; }\n\nbody .ui-widget,\nbody .ui-autocomplete.ui-autocomplete-multiple .ui-autocomplete-multiple-container .ui-autocomplete-input-token input,\nbody .ui-chips > ul.ui-inputtext .ui-chips-input-token input,\nbody .ui-table .ui-editable-column input,\nbody .ui-treetable .ui-editable-column input,\nbody .ui-terminal .ui-terminal-input {\n  font-family: Roboto, \"Helvetica Neue\", Helvetica, Arial, sans-serif !important; }\n\nbody .secondary-col, body .ui-orderlist .ui-orderlist-controls button,\nbody .ui-button.ui-state-default.ui-button-secondary,\nbody .ui-buttonset.ui-button-secondary > .ui-button.ui-state-default {\n  color: #333333;\n  background-color: #e8e8e8;\n  border-color: #e8e8e8; }\n\nbody .secondary-col:hover, body .ui-orderlist .ui-orderlist-controls button:hover,\nbody .ui-button.ui-state-default.ui-button-secondary:enabled:hover,\nbody .ui-buttonset.ui-button-secondary > .ui-button.ui-state-default:enabled:hover {\n  background-color: #c8c8c8;\n  color: #333333;\n  border-color: #c8c8c8; }\n\nbody .secondary-col:enabled:focus, body .ui-orderlist .ui-orderlist-controls button:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-secondary:enabled:focus,\nbody .ui-buttonset.ui-button-secondary > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #8dcdff; }\n\nbody .secondary-col:active, body .ui-orderlist .ui-orderlist-controls button:active,\nbody .ui-button.ui-state-default.ui-button-secondary:enabled:active,\nbody .ui-buttonset.ui-button-secondary > .ui-button.ui-state-default:enabled:active {\n  background-color: #a0a0a0;\n  color: #333333;\n  border-color: #a0a0a0; }\n\nbody .default-col,\nbody .ui-button.ui-state-default.ui-button-info,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default {\n  color: #ffffff;\n  background-color: #007ad9;\n  border-color: #007ad9; }\n\nbody .default-col:hover,\nbody .ui-button.ui-state-default.ui-button-info:enabled:hover,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default:enabled:hover {\n  background-color: #116fbf;\n  color: #ffffff;\n  border-color: #116fbf; }\n\nbody .default-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-info:enabled:focus,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #8dcdff; }\n\nbody .default-col:active,\nbody .ui-button.ui-state-default.ui-button-info:enabled:active,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default:enabled:active {\n  background-color: #005b9f;\n  color: #ffffff;\n  border-color: #005b9f; }\n\nbody .success-col,\nbody .ui-button.ui-state-default.ui-button-success,\nbody .ui-buttonset.ui-button-success > .ui-button.ui-state-default {\n  color: #ffffff;\n  background-color: #34a835;\n  border-color: #34a835; }\n\nbody .success-col:hover,\nbody .ui-button.ui-state-default.ui-button-success:enabled:hover,\nbody .ui-buttonset.ui-button-success > .ui-button.ui-state-default:enabled:hover {\n  background-color: #107d11;\n  color: #ffffff;\n  border-color: #107d11; }\n\nbody .success-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-success:enabled:focus,\nbody .ui-buttonset.ui-button-success > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #aae5aa; }\n\nbody .success-col:active,\nbody .ui-button.ui-state-default.ui-button-success:enabled:active,\nbody .ui-buttonset.ui-button-success > .ui-button.ui-state-default:enabled:active {\n  background-color: #0c6b0d;\n  color: #ffffff;\n  border-color: #0c6b0d; }\n\nbody .success-col-outline,\nbody .ui-button.ui-state-default.ui-button-success-outline,\nbody .ui-buttonset.ui-button-success-outline > .ui-button.ui-state-default {\n  color: #34a835;\n  background-color: #fff;\n  border-color: #fff; }\n\nbody .success-col-outline:hover,\nbody .ui-button.ui-state-default.ui-button-success-outline:enabled:hover,\nbody .ui-buttonset.ui-button-success-outline > .ui-button.ui-state-default:enabled:hover {\n  background-color: #fff;\n  color: #107d11;\n  border-color: #fff; }\n\nbody .success-col-outline:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-success-outline:enabled:focus,\nbody .ui-buttonset.ui-button-success-outline > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #aae5aa; }\n\nbody .success-col-outline:active,\nbody .ui-button.ui-state-default.ui-button-success-outline:enabled:active,\nbody .ui-buttonset.ui-button-success-outline > .ui-button.ui-state-default:enabled:active {\n  background-color: #fff;\n  color: #0c6b0d;\n  border-color: #fff; }\n\nbody .warning-col,\nbody .ui-button.ui-state-default.ui-button-warning,\nbody .ui-buttonset.ui-button-warning > .ui-button.ui-state-default {\n  color: #333333;\n  background-color: #ffba01;\n  border-color: #ffba01; }\n\nbody .warning-col:hover,\nbody .ui-button.ui-state-default.ui-button-warning:enabled:hover,\nbody .ui-buttonset.ui-button-warning > .ui-button.ui-state-default:enabled:hover {\n  background-color: #ed990b;\n  color: #333333;\n  border-color: #ed990b; }\n\nbody .warning-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-warning:enabled:focus,\nbody .ui-buttonset.ui-button-warning > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #ffeab4; }\n\nbody .warning-col:active,\nbody .ui-button.ui-state-default.ui-button-warning:enabled:active,\nbody .ui-buttonset.ui-button-warning > .ui-button.ui-state-default:enabled:active {\n  background-color: #d38b10;\n  color: #333333;\n  border-color: #d38b10; }\n\nbody .danger-col,\nbody .ui-button.ui-state-default.ui-button-danger,\nbody .ui-buttonset.ui-button-danger > .ui-button.ui-state-default {\n  color: #ffffff;\n  background-color: #e91224;\n  border-color: #e91224; }\n\nbody .danger-col:hover,\nbody .ui-button.ui-state-default.ui-button-danger:enabled:hover,\nbody .ui-buttonset.ui-button-danger > .ui-button.ui-state-default:enabled:hover {\n  background-color: #c01120;\n  color: #ffffff;\n  border-color: #c01120; }\n\nbody .danger-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-danger:enabled:focus,\nbody .ui-buttonset.ui-button-danger > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #f9b4ba; }\n\nbody .danger-col:active,\nbody .ui-button.ui-state-default.ui-button-danger:enabled:active,\nbody .ui-buttonset.ui-button-danger > .ui-button.ui-state-default:enabled:active {\n  background-color: #a90000;\n  color: #ffffff;\n  border-color: #a90000; }\n\nbody .danger-col-outline,\nbody .ui-button.ui-state-default.ui-button-danger-outline,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default {\n  color: #e91224;\n  background-color: #fff;\n  border-color: #fff; }\n\nbody .ui-button.ui-state-default.ui-button-danger-outline,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default {\n  border-color: #e91224; }\n\nbody .danger-col-outline:hover,\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:hover,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:hover {\n  background-color: #fff;\n  color: #c01120;\n  border-color: #fff; }\n\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:hover,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:hover {\n  border-color: #c01120; }\n\nbody .danger-col-outline:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:focus,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #f9b4ba; }\n\nbody .danger-col-outline:active,\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:active,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:active {\n  background-color: #fff;\n  color: #a90000;\n  border-color: #fff; }\n\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:active,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:active {\n  border-color: #a90000; }\n\nbody .ui-dialog .ui-dialog-footer button,\nbody .ui-card .ui-card-footer button {\n  margin: 0 0 0 0.5em !important; }\n\nbody .ui-dialog {\n  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1) !important; }\n\nbody .ui-dialog .ui-dialog-titlebar {\n  border-radius: 4px 4px 0 0; }\n\nbody .ui-dialog .ui-dialog-footer {\n  border-radius: 0 0 4px 4px; }\n\nbody .ui-messages-error {\n  border: none;\n  font-weight: 800;\n  padding: 0;\n  display: block;\n  width: 100%;\n  text-align: right;\n  color: #a80000; }\n\nbody .ng-dirty.ng-invalid + ul {\n  -webkit-padding-start: 0;\n          padding-inline-start: 0; }\n\nbody .ui-inputtext.ng-invalid:enabled:focus,\n.ui-inputtext {\n  border-color: #a80000; }\n\nbody .ui-inputtext,\nbody .ui-inputgroup .ui-inputtext.ng-dirty.ng-invalid + .ui-inputgroup-addon {\n  transition: box-shadow 0.2s; }\n\nbody .ui-inputtext.ng-dirty.ng-invalid,\nbody p-dropdown.ng-dirty.ng-invalid > .ui-dropdown,\nbody p-autocomplete.ng-dirty.ng-invalid > .ui-autocomplete > .ui-inputtext,\nbody p-calendar.ng-dirty.ng-invalid > .ui-calendar > .ui-inputtext,\nbody p-chips.ng-dirty.ng-invalid > .ui-inputtext,\nbody p-inputmask.ng-dirty.ng-invalid > .ui-inputtext,\nbody p-checkbox.ng-dirty.ng-invalid .ui-chkbox-box,\nbody p-radiobutton.ng-dirty.ng-invalid .ui-radiobutton-box,\nbody p-inputswitch.ng-dirty.ng-invalid .ui-inputswitch,\nbody p-listbox.ng-dirty.ng-invalid .ui-inputtext,\nbody p-multiselect.ng-dirty.ng-invalid > .ui-multiselect,\nbody p-spinner.ng-dirty.ng-invalid > .ui-inputtext,\nbody p-selectbutton.ng-dirty.ng-invalid .ui-button,\nbody p-togglebutton.ng-dirty.ng-invalid .ui-button {\n  box-shadow: 0 0 0 0.2em #f9b4ba; }\n\nbody .ui-inputgroup .ui-inputtext.ng-dirty.ng-invalid + .ui-inputgroup-addon {\n  box-shadow: 2px -2.8px 0 #f9b4ba, 2px 2.8px 0 #f9b4ba; }\n\nbody p-calendar.ng-dirty.ng-invalid > .ui-calendar.ui-calendar-w-btn {\n  box-shadow: 0 0 0 3px #f9b4ba;\n  border-radius: 4px; }\n\nbody .ui-inputgroup .ui-inputtext:enabled:focus:not(.ui-state-error) + .ui-inputgroup-addon,\nbody p-calendar.ng-dirty.ng-invalid > .ui-calendar > .ui-inputtext:enabled:focus:not(.ui-state-error),\nbody p-calendar.ng-dirty.ng-invalid > .ui-calendar > .ui-inputtext:enabled:focus:not(.ui-state-error) + .ui-calendar-button {\n  box-shadow: none; }\n\n*:not(.ui-calendar) .ui-inputtext {\n  width: 100%; }\n\nbody .ui-state-disabled,\nbody .ui-widget:disabled {\n  cursor: not-allowed; }\n\n.form dynamic-primeng-form-control > div {\n  margin-bottom: 10px; }\n\n.form .ui-calendar,\n.form .ui-spinner {\n  width: 100%; }\n\n.form .ui-calendar-w-btn input.ui-inputtext {\n  width: calc(100% - 33px); }\n\n.form .ui-datepicker {\n  padding: 0.5em; }\n\n.form .ui-datepicker {\n  font-size: 12px; }\n\n.form .ui-datepicker .ui-timepicker {\n  padding: 10px 0 0 0;\n  font-size: 11px; }\n\n.form .ui-datepicker table {\n  font-size: 11px; }\n\n/* width */\n\n::-webkit-scrollbar {\n  width: 10px; }\n\n/* Track */\n\n::-webkit-scrollbar-track {\n  background: none; }\n\n/* Handle */\n\n::-webkit-scrollbar-thumb {\n  background: #00000033;\n  border: 2px solid rgba(0, 0, 0, 0);\n  background-clip: padding-box;\n  border-radius: 5px; }\n\n/* Handle on hover */\n\n::-webkit-scrollbar-thumb:hover {\n  background: #00000055;\n  background-clip: padding-box; }\n\n.fake-leaflet-control,\n.fake-leaflet-control-lg,\n.fake-leaflet-control-colours,\nbody .ui-sidebar,\n#connection-status,\nbody .geoweb-menu.ui-slidemenu {\n  color: #333;\n  background: #fff;\n  border-radius: 4px;\n  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);\n  border: none;\n  background-clip: padding-box; }\n\n.fake-leaflet-control.active,\n.fake-leaflet-control-lg.active,\n.fake-leaflet-control-colours.active,\nbody .active.ui-sidebar,\n.active#connection-status,\nbody .active.geoweb-menu.ui-slidemenu {\n  background-color: #007ad9;\n  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);\n  color: #ffffff; }\n\n.fake-leaflet-control,\n.fake-leaflet-control-lg {\n  margin-bottom: 10px;\n  position: relative; }\n\n.fake-leaflet-control {\n  height: 30px;\n  width: 30px; }\n\n.fake-leaflet-control-lg {\n  height: 44px;\n  width: 44px; }\n\n.fake-leaflet-control a,\n.fake-leaflet-control-lg a {\n  color: inherit;\n  height: 100%;\n  width: 100%;\n  display: block;\n  line-height: 0; }\n\n.fake-leaflet-control:hover,\n.fake-leaflet-control-lg:hover {\n  background-color: #f4f4f4; }\n\n.fake-leaflet-control a:hover,\n.fake-leaflet-control-lg a:hover {\n  color: #333;\n  cursor: pointer; }\n\n.fake-leaflet-control.active:hover,\n.fake-leaflet-control-lg.active:hover {\n  background-color: #1775bd; }\n\n.fake-leaflet-control.active a:hover,\n.fake-leaflet-control-lg.active a:hover,\n.fake-leaflet-control-colours.active a:hover,\nbody .active.ui-sidebar a:hover,\n.active#connection-status a:hover,\nbody .active.geoweb-menu.ui-slidemenu a:hover {\n  color: #ffffff; }\n\n.fake-leaflet-control fa-icon.ng-fa-icon,\n.fake-leaflet-control-lg fa-icon.ng-fa-icon {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%); }\n\n.fake-leaflet-control a {\n  font-size: 12px; }\n\n.fake-leaflet-control-lg a {\n  font-size: 24px; }\n\n.fake-leaflet-control-lg span {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%); }\n\nbody .ui-sidebar {\n  z-index: 1400 !important;\n  transition: transform 0.3s cubic-bezier(0.455, 0.03, 0.515, 0.955);\n  padding: 0;\n  border-radius: 0; }\n\nbody .ui-sidebar-bottom {\n  box-shadow: 0 -8px 0px 2px rgba(0, 0, 0, 0.2); }\n\nbody .ui-sidebar-bottom,\nbody .ui-sidebar-top {\n  height: 320px; }\n\nbody .ui-sidebar-left,\nbody .ui-sidebar-right {\n  width: 313px; }\n\n.ui-sidebar.width-fit-content {\n  width: -webkit-fit-content;\n  width: -moz-fit-content;\n  width: fit-content; }\n\n.ui-sidebar.height-fit-content {\n  height: -webkit-fit-content;\n  height: -moz-fit-content;\n  height: fit-content; }\n\n.ui-sidebar.width-fit-content .sidebar-container {\n  min-width: 313px;\n  max-width: 100vw; }\n\n.sidebar-container {\n  height: calc(100% - 53px);\n  overflow-y: auto;\n  overflow-y: overlay;\n  -ms-overflow-style: -ms-autohiding-scrollbar;\n  overflow-x: hidden; }\n\n.sidebar-padding {\n  padding-top: 0.571em;\n  padding-right: 1em;\n  padding-bottom: 0.571em;\n  padding-left: 1em; }\n\n.sidebar-footer {\n  border-top: 1px solid #c8c8c8;\n  background: #f4f4f4; }\n\nbody .ui-sidebar .ui-sidebar-close {\n  padding-top: 0.571em;\n  padding-right: 1em;\n  padding-bottom: 0.571em;\n  padding-left: 1em;\n  float: none;\n  position: absolute;\n  right: 0;\n  top: 0; }\n\nbody .ui-sidebar h1 {\n  margin-bottom: 0;\n  margin-top: -8px;\n  padding-top: 23px;\n  padding-left: 15px;\n  padding-bottom: 0.67em;\n  padding-right: 100px;\n  background-color: #f4f4f4;\n  border-bottom: 1px solid #c8c8c8; }\n\n@media (min-width: 768px) {\n  body .sidebar-container .ui-orderlist-controls-right {\n    margin-right: -15px; } }\n\n.ui-state-highlight a.icon-toggle.default-col {\n  background-color: #0065b3; }\n\n#connection-status {\n  position: absolute;\n  top: 10px;\n  left: 50% !important;\n  transform: translateX(-50%);\n  text-align: center;\n  z-index: 1300;\n  padding: 5px 10px;\n  background-clip: padding-box;\n  font-size: 14px; }\n\n#connection-status.disconnected {\n  color: crimson; }\n\n#connection-status.connected {\n  color: #00bb88; }\n\n#top-left-controls {\n  position: absolute;\n  top: 10px;\n  left: 10px;\n  z-index: 1300; }\n\nbody .geoweb-menu.ui-slidemenu {\n  width: 190px;\n  margin-top: 14px;\n  border: none; }\n\nbody .ui-slidemenu .ui-slidemenu-content {\n  border-radius: 4px; }\n\n.geoweb-container {\n  overflow: hidden; }\n\n.ui-widget-overlay.ui-dialog-mask {\n  z-index: 1500 !important; }\n\n.ui-dialog {\n  z-index: 1501 !important; }\n\n.log-sidebar .sidebar-container.log-messages-container {\n  max-height: calc(100% - 121px);\n  overflow-y: auto;\n  overflow-y: overlay;\n  -ms-overflow-style: -ms-autohiding-scrollbar;\n  overflow-x: visible;\n  padding-top: 1em; }\n\n.log-sidebar > p-button {\n  margin-left: 1em !important;\n  margin-right: 1em !important; }\n\n.log-message {\n  line-height: 1.2;\n  margin: 0;\n  font-family: monospace;\n  font-size: 12px;\n  padding-bottom: 10px;\n  word-break: break-word; }\n\n.job-control-buttons {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  width: 100%;\n  height: 50px; }\n\n.ui-listbox.load-job-list li.ui-listbox-item {\n  display: grid !important;\n  grid-template-columns: minmax(-webkit-min-content, auto) auto -webkit-max-content;\n  grid-template-columns: minmax(min-content, auto) auto max-content;\n  grid-gap: 10px; }\n\n.ui-listbox.load-job-list li.ui-listbox-item > span {\n  max-width: 296px;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYXdhbm1hY2Jvb2svRG9jdW1lbnRzL2Rzcy9jbGllbnQvc3JjL2FwcC9nZW8td2ViL3N0eWxlcy9mYWtlLWxlYWZsZXQtY29udHJvbC5zY3NzIiwiL1VzZXJzL3Bhd2FubWFjYm9vay9Eb2N1bWVudHMvZHNzL2NsaWVudC9zcmMvc3R5bGVzLnNjc3MiLCIvVXNlcnMvcGF3YW5tYWNib29rL0RvY3VtZW50cy9kc3MvY2xpZW50L3NyYy9hcHAvZ2VvLXdlYi9zdHlsZXMvc2lkZWJhci5zY3NzIiwiL1VzZXJzL3Bhd2FubWFjYm9vay9Eb2N1bWVudHMvZHNzL2NsaWVudC9zcmMvYXBwL2dlby13ZWIvZ2Vvd2ViLmNvbXBvbmVudC5zY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7RUFHRSxXQUFXO0VBQ1gsZ0JBQWdCO0VBQ2hCLGtCQUFrQjtFQUNsQix3Q0FBd0M7RUFDeEMsWUFBWTtFQUNaLDRCQUE0QixFQUFBOztBQUc5Qjs7Ozs7O0VBR0UseUJBQXlCO0VBQ3pCLDhDQUE4QztFQUM5QyxjQUFjLEVBQUE7O0FBR2hCOztFQUVFLG1CQUFtQjtFQUNuQixrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxZQUFZO0VBQ1osV0FBVyxFQUFBOztBQUdiO0VBQ0UsWUFBWTtFQUNaLFdBQVcsRUFBQTs7QUFHYjs7RUFFRSxjQUFjO0VBQ2QsWUFBWTtFQUNaLFdBQVc7RUFDWCxjQUFjO0VBQ2QsY0FBYyxFQUFBOztBQUdoQjs7RUFFRSx5QkFBeUIsRUFBQTs7QUFHM0I7O0VBRUUsV0FBVztFQUNYLGVBQWUsRUFBQTs7QUFHakI7O0VBRUUseUJBQXlCLEVBQUE7O0FBRzNCOzs7Ozs7RUFHRSxjQUFjLEVBQUE7O0FBR2hCOztFQUVFLGtCQUFrQjtFQUNsQixRQUFRO0VBQ1IsU0FBUztFQUNULGdDQUFnQyxFQUFBOztBQUdsQztFQUNFLGVBQWUsRUFBQTs7QUFHakI7RUFDRSxlQUFlLEVBQUE7O0FBRWpCO0VBQ0Usa0JBQWtCO0VBQ2xCLFFBQVE7RUFDUixTQUFTO0VBQ1QsZ0NBQWdDLEVBQUE7O0FDckZsQztFQUNFLHNCQUFzQixFQUFBOztBQUd4Qjs7RUFFRSw4RUFBOEU7RUFDOUUsZUFBZTtFQUNmLFNBQVM7RUFDVCxVQUFVLEVBQUE7O0FBR1o7RUFDRSw4RUFBOEU7RUFDOUUsZUFBZSxFQUFBOztBQUdqQjs7RUFFRSxlQUFlO0VBQ2YsZ0JBQWdCLEVBQUE7O0FBR2xCOztFQUVFLGVBQWU7RUFDZixnQkFBZ0IsRUFBQTs7QUFPbEI7RUFDRSxzQkFBc0I7RUFDdEIsZ0JBQWdCO0VBQ2hCLHFCQUFxQjtFQUNyQiwwQkFBMEI7RUFDMUIsc0JBQXNCO0VBQ3RCLHdCQUF3QjtFQUN4QixxQkFBcUIsRUFBQTs7QUFHdkI7RUFDRSxnQkFBZ0I7RUFDaEIsa0JBQWtCLEVBQUE7O0FBR3BCO0VBQ0UsbUJBQW1CO0VBQ25CLGdCQUFnQjtFQUNoQix1QkFBdUIsRUFBQTs7QUFHekI7O0VBRUUsY0FBYztFQUNkLG1CQUFtQjtFQUNuQixnQkFBZ0IsRUFBQTs7QUFHbEI7RUFDRSxrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxtQkFBbUIsRUFBQTs7QUFHckI7RUFDRSxrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxpQkFBaUI7RUFDakIsY0FBYyxFQUFBOztBQUdoQjtFQUNFLG9DQUFvQztFQUNwQywyQkFBMkIsRUFBQTs7QUFHN0I7RUFDRSxjQUFjLEVBQUE7O0FBR2hCO0VBQ0UsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0UsV0FBVztFQUNYLGdCQUFnQjtFQUNoQixlQUFlO0VBQ2Ysa0JBQUE7RUFDQSxrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxpQkFBaUI7RUFDakIsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0Usc0JBQXNCLEVBQUE7O0FBR3hCO0VBQ0UsWUFBWSxFQUFBOztBQUlkO0VBQ0UsbUJBQW1CLEVBQUE7O0FBR3JCO0VBQ0UsK0JBQStCO0VBQy9CLGlCQUFpQixFQUFBOztBQUduQjtFQUNFLCtCQUErQjtFQUMvQixpQkFBaUI7RUFDakIsZ0JBQWdCO0VBQ2hCLG1CQUFtQjtFQUVuQiw0Q0FBNEM7RUFFNUMsaUJBQWlCO0VBQ2pCLGtCQUFrQixFQUFBOztBQUdwQjs7RUFFRSxpQkFBaUI7RUFDakIsa0JBQWtCLEVBQUE7O0FBR3BCO0VBQ0UsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0UsbUJBQW1CLEVBQUE7O0FBR3JCO0VBQ0UscUJBQXFCO0VBQ3JCLFdBQVc7RUFDWCxZQUFZO0VBQ1osZUFBZTtFQUNmLG1CQUFtQjtFQUNuQiwyQkFBMkIsRUFBQTs7QUFJN0I7RUFDRSxlQUFlO0VBQ2YsaUJBQWlCO0VBQ2pCLGNBQWMsRUFBQTs7QUFHaEI7RUFDRSxxQkFBcUIsRUFBQTs7QUFJdkI7Ozs7OztFQVVFLDhFQUE4RSxFQUFBOztBQUloRjs7O0VBR0UsY0FBYztFQUNkLHlCQUF5QjtFQUN6QixxQkFBcUIsRUFBQTs7QUFFdkI7OztFQUtFLHlCQUF5QjtFQUN6QixjQUFjO0VBQ2QscUJBQXFCLEVBQUE7O0FBR3ZCOzs7RUFPRSwrQkFBK0IsRUFBQTs7QUFFakM7OztFQUtFLHlCQUF5QjtFQUN6QixjQUFjO0VBQ2QscUJBQXFCLEVBQUE7O0FBRXZCOzs7RUFHRSxjQUFjO0VBQ2QseUJBQXlCO0VBQ3pCLHFCQUFxQixFQUFBOztBQUV2Qjs7O0VBR0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFFdkI7OztFQUtFLCtCQUErQixFQUFBOztBQUVqQzs7O0VBR0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFJdkI7OztFQUdFLGNBQWM7RUFDZCx5QkFBeUI7RUFDekIscUJBQXFCLEVBQUE7O0FBRXZCOzs7RUFLRSx5QkFBeUI7RUFDekIsY0FBYztFQUNkLHFCQUFxQixFQUFBOztBQUV2Qjs7O0VBT0UsK0JBQStCLEVBQUE7O0FBRWpDOzs7RUFLRSx5QkFBeUI7RUFDekIsY0FBYztFQUNkLHFCQUFxQixFQUFBOztBQUl2Qjs7O0VBR0UsY0FBYztFQUNkLHNCQUFzQjtFQUN0QixrQkFBa0IsRUFBQTs7QUFFcEI7OztFQUtFLHNCQUFzQjtFQUN0QixjQUFjO0VBQ2Qsa0JBQWtCLEVBQUE7O0FBRXBCOzs7RUFPRSwrQkFBK0IsRUFBQTs7QUFFakM7OztFQUtFLHNCQUFzQjtFQUN0QixjQUFjO0VBQ2Qsa0JBQWtCLEVBQUE7O0FBSXBCOzs7RUFHRSxjQUFjO0VBQ2QseUJBQXlCO0VBQ3pCLHFCQUFxQixFQUFBOztBQUV2Qjs7O0VBS0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFFdkI7OztFQU9FLCtCQUErQixFQUFBOztBQUVqQzs7O0VBS0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFJdkI7OztFQUdFLGNBQWM7RUFDZCx5QkFBeUI7RUFDekIscUJBQXFCLEVBQUE7O0FBRXZCOzs7RUFLRSx5QkFBeUI7RUFDekIsY0FBYztFQUNkLHFCQUFxQixFQUFBOztBQUV2Qjs7O0VBT0UsK0JBQStCLEVBQUE7O0FBRWpDOzs7RUFLRSx5QkFBeUI7RUFDekIsY0FBYztFQUNkLHFCQUFxQixFQUFBOztBQUl2Qjs7O0VBR0UsY0FBYztFQUNkLHNCQUFzQjtFQUN0QixrQkFBa0IsRUFBQTs7QUFHcEI7O0VBRUUscUJBQXFCLEVBQUE7O0FBR3ZCOzs7RUFLRSxzQkFBc0I7RUFDdEIsY0FBYztFQUNkLGtCQUFrQixFQUFBOztBQUdwQjs7RUFJRSxxQkFBcUIsRUFBQTs7QUFHdkI7OztFQU9FLCtCQUErQixFQUFBOztBQUVqQzs7O0VBS0Usc0JBQXNCO0VBQ3RCLGNBQWM7RUFDZCxrQkFBa0IsRUFBQTs7QUFHcEI7O0VBSUUscUJBQXFCLEVBQUE7O0FBTXZCOztFQUVFLDhCQUE4QixFQUFBOztBQUdoQztFQUNFLG1EQUFtRCxFQUFBOztBQTdUckQ7RUFpVUUsMEJBQTBCLEVBQUE7O0FBN1Q1QjtFQWlVRSwwQkFBMEIsRUFBQTs7QUFJNUI7RUFDRSxZQUFZO0VBQ1osZ0JBQWdCO0VBQ2hCLFVBQVU7RUFDVixjQUFjO0VBQ2QsV0FBVztFQUVYLGlCQUFpQjtFQUdqQixjQUFjLEVBQUE7O0FBSWhCO0VBQ0Usd0JBQXVCO1VBQXZCLHVCQUF1QixFQUFBOztBQUl6Qjs7RUFFRSxxQkFBcUIsRUFBQTs7QUFJdkI7O0VBRUUsMkJBQTJCLEVBQUE7O0FBRzdCOzs7Ozs7Ozs7Ozs7OztFQWNFLCtCQUErQixFQUFBOztBQUlqQztFQUNFLHFEQUFxRCxFQUFBOztBQUd2RDtFQUNFLDZCQUE2QjtFQUM3QixrQkFBa0IsRUFBQTs7QUFHcEI7OztFQWFFLGdCQUFnQixFQUFBOztBQUlsQjtFQUNFLFdBQVcsRUFBQTs7QUFHYjs7RUFFRSxtQkFBbUIsRUFBQTs7QUFLckI7RUFDRSxtQkFBbUIsRUFBQTs7QUFHckI7O0VBRUUsV0FBVyxFQUFBOztBQUliO0VBQ0Usd0JBQXdCLEVBQUE7O0FBSTFCO0VBQ0UsY0FBYyxFQUFBOztBQURoQjtFQUtFLGVBQWUsRUFBQTs7QUFHakI7RUFDRSxtQkFBbUI7RUFDbkIsZUFBZSxFQUFBOztBQUdqQjtFQUNFLGVBQWUsRUFBQTs7QUFNakIsVUFBQTs7QUFDQTtFQUNFLFdBQVcsRUFBQTs7QUFHYixVQUFBOztBQUNBO0VBQ0UsZ0JBQWdCLEVBQUE7O0FBR2xCLFdBQUE7O0FBQ0E7RUFDRSxxQkFBcUI7RUFDckIsa0NBQWtDO0VBQ2xDLDRCQUE0QjtFQUM1QixrQkFBa0IsRUFBQTs7QUFHcEIsb0JBQUE7O0FBQ0E7RUFDRSxxQkFBcUI7RUFDckIsNEJBQTRCLEVBQUE7O0FEbG1COUI7Ozs7OztFQUdFLFdBQVc7RUFDWCxnQkFBZ0I7RUFDaEIsa0JBQWtCO0VBQ2xCLHdDQUF3QztFQUN4QyxZQUFZO0VBQ1osNEJBQTRCLEVBQUE7O0FBRzlCOzs7Ozs7RUFHRSx5QkFBeUI7RUFDekIsOENBQThDO0VBQzlDLGNBQWMsRUFBQTs7QUFHaEI7O0VBRUUsbUJBQW1CO0VBQ25CLGtCQUFrQixFQUFBOztBQUdwQjtFQUNFLFlBQVk7RUFDWixXQUFXLEVBQUE7O0FBR2I7RUFDRSxZQUFZO0VBQ1osV0FBVyxFQUFBOztBQUdiOztFQUVFLGNBQWM7RUFDZCxZQUFZO0VBQ1osV0FBVztFQUNYLGNBQWM7RUFDZCxjQUFjLEVBQUE7O0FBR2hCOztFQUVFLHlCQUF5QixFQUFBOztBQUczQjs7RUFFRSxXQUFXO0VBQ1gsZUFBZSxFQUFBOztBQUdqQjs7RUFFRSx5QkFBeUIsRUFBQTs7QUFHM0I7Ozs7OztFQUdFLGNBQWMsRUFBQTs7QUFHaEI7O0VBRUUsa0JBQWtCO0VBQ2xCLFFBQVE7RUFDUixTQUFTO0VBQ1QsZ0NBQWdDLEVBQUE7O0FBR2xDO0VBQ0UsZUFBZSxFQUFBOztBQUdqQjtFQUNFLGVBQWUsRUFBQTs7QUFFakI7RUFDRSxrQkFBa0I7RUFDbEIsUUFBUTtFQUNSLFNBQVM7RUFDVCxnQ0FBZ0MsRUFBQTs7QUVsRmxDO0VBRUUsd0JBQXdCO0VBQ3hCLGtFQUFrRTtFQUNsRSxVQUFVO0VBQ1YsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0UsNkNBQTZDLEVBQUE7O0FBRy9DOztFQUVFLGFBQWEsRUFBQTs7QUFHZjs7RUFFRSxZQUFZLEVBQUE7O0FBR2Q7RUFDRSwwQkFBa0I7RUFBbEIsdUJBQWtCO0VBQWxCLGtCQUFrQixFQUFBOztBQUdwQjtFQUNFLDJCQUFtQjtFQUFuQix3QkFBbUI7RUFBbkIsbUJBQW1CLEVBQUE7O0FBR3JCO0VBQ0UsZ0JBQWdCO0VBQ2hCLGdCQUFnQixFQUFBOztBQUlsQjtFQUNFLHlCQUF5QjtFQUN6QixnQkFBZ0I7RUFDaEIsbUJBQW1CO0VBQ25CLDRDQUE0QztFQUM1QyxrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxvQkFBb0I7RUFDcEIsa0JBQWtCO0VBQ2xCLHVCQUF1QjtFQUN2QixpQkFBaUIsRUFBQTs7QUFHbkI7RUFDRSw2QkFBNkI7RUFDN0IsbUJBQW1CLEVBQUE7O0FBR3JCO0VBQ0Usb0JBQW9CO0VBQ3BCLGtCQUFrQjtFQUNsQix1QkFBdUI7RUFDdkIsaUJBQWlCO0VBQ2pCLFdBQVc7RUFDWCxrQkFBa0I7RUFDbEIsUUFBUTtFQUNSLE1BQU0sRUFBQTs7QUFHUjtFQUNFLGdCQUFnQjtFQUNoQixnQkFBZ0I7RUFDaEIsaUJBQWlCO0VBQ2pCLGtCQUFrQjtFQUNsQixzQkFBc0I7RUFDdEIsb0JBQW9CO0VBQ3BCLHlCQUF5QjtFQUN6QixnQ0FBZ0MsRUFBQTs7QUFHbEM7RUFDRTtJQUNFLG1CQUFtQixFQUFBLEVBQ3BCOztBQXFCSDtFQUNFLHlCQUF5QixFQUFBOztBQ3RHM0I7RUFFRSxrQkFBa0I7RUFDbEIsU0FBUztFQUNULG9CQUFvQjtFQUNwQiwyQkFBMkI7RUFDM0Isa0JBQWtCO0VBQ2xCLGFBQWE7RUFDYixpQkFBaUI7RUFDakIsNEJBQTRCO0VBQzVCLGVBQWUsRUFBQTs7QUFHakI7RUFDRSxjQUFjLEVBQUE7O0FBR2hCO0VBQ0UsY0FBYyxFQUFBOztBQUdoQjtFQUNFLGtCQUFrQjtFQUNsQixTQUFTO0VBQ1QsVUFBVTtFQUNWLGFBQWEsRUFBQTs7QUFHZjtFQUVFLFlBQVk7RUFDWixnQkFBZ0I7RUFDaEIsWUFBWSxFQUFBOztBQUdkO0VBQ0Usa0JBQWtCLEVBQUE7O0FBdURwQjtFQUNFLGdCQUFnQixFQUFBOztBQUtsQjtFQUNFLHdCQUF3QixFQUFBOztBQUcxQjtFQUNFLHdCQUF3QixFQUFBOztBQUcxQjtFQUNFLDhCQUE4QjtFQUM5QixnQkFBZ0I7RUFDaEIsbUJBQW1CO0VBQ25CLDRDQUE0QztFQUM1QyxtQkFBbUI7RUFDbkIsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0UsMkJBQTJCO0VBQzNCLDRCQUE0QixFQUFBOztBQUc5QjtFQUNFLGdCQUFnQjtFQUNoQixTQUFTO0VBQ1Qsc0JBQXNCO0VBQ3RCLGVBQWU7RUFDZixvQkFBb0I7RUFDcEIsc0JBQXNCLEVBQUE7O0FBR3hCO0VBQ0Usa0JBQWtCO0VBQ2xCLFNBQVM7RUFDVCxPQUFPO0VBQ1AsV0FBVztFQUNYLFlBQVksRUFBQTs7QUFHZDtFQUNFLHdCQUF3QjtFQUN4QixpRkFBaUU7RUFBakUsaUVBQWlFO0VBQ2pFLGNBQWMsRUFBQTs7QUFHaEI7RUFDRSxnQkFBZ0I7RUFDaEIsbUJBQW1CO0VBQ25CLGdCQUFnQjtFQUNoQix1QkFBdUIsRUFBQSIsImZpbGUiOiJzcmMvYXBwL2dlby13ZWIvZ2Vvd2ViLmNvbXBvbmVudC5zY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLmZha2UtbGVhZmxldC1jb250cm9sLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWNvbG91cnMge1xuICBjb2xvcjogIzMzMztcbiAgYmFja2dyb3VuZDogI2ZmZjtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xuICBib3gtc2hhZG93OiAwIDAgMCAycHggcmdiYSgwLCAwLCAwLCAwLjEpO1xuICBib3JkZXI6IG5vbmU7XG4gIGJhY2tncm91bmQtY2xpcDogcGFkZGluZy1ib3g7XG59XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbC5hY3RpdmUsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcuYWN0aXZlLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWNvbG91cnMuYWN0aXZlIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzAwN2FkOTtcbiAgYm94LXNoYWRvdzogMCAwIDAgMnB4IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgY29sb3I6ICNmZmZmZmY7XG59XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbCxcbi5mYWtlLWxlYWZsZXQtY29udHJvbC1sZyB7XG4gIG1hcmdpbi1ib3R0b206IDEwcHg7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sIHtcbiAgaGVpZ2h0OiAzMHB4O1xuICB3aWR0aDogMzBweDtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIHtcbiAgaGVpZ2h0OiA0NHB4O1xuICB3aWR0aDogNDRweDtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sIGEsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcgYSB7XG4gIGNvbG9yOiBpbmhlcml0O1xuICBoZWlnaHQ6IDEwMCU7XG4gIHdpZHRoOiAxMDAlO1xuICBkaXNwbGF5OiBibG9jaztcbiAgbGluZS1oZWlnaHQ6IDA7XG59XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbDpob3Zlcixcbi5mYWtlLWxlYWZsZXQtY29udHJvbC1sZzpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmNGY0ZjQ7XG59XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbCBhOmhvdmVyLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIGE6aG92ZXIge1xuICBjb2xvcjogIzMzMztcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wuYWN0aXZlOmhvdmVyLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnLmFjdGl2ZTpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICMxNzc1YmQ7XG59XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbC5hY3RpdmUgYTpob3Zlcixcbi5mYWtlLWxlYWZsZXQtY29udHJvbC1sZy5hY3RpdmUgYTpob3Zlcixcbi5mYWtlLWxlYWZsZXQtY29udHJvbC1jb2xvdXJzLmFjdGl2ZSBhOmhvdmVyIHtcbiAgY29sb3I6ICNmZmZmZmY7XG59XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbCBmYS1pY29uLm5nLWZhLWljb24sXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcgZmEtaWNvbi5uZy1mYS1pY29uIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDUwJTtcbiAgbGVmdDogNTAlO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLCAtNTAlKTtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sIGEge1xuICBmb250LXNpemU6IDEycHg7XG59XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbC1sZyBhIHtcbiAgZm9udC1zaXplOiAyNHB4O1xufVxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIHNwYW4ge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogNTAlO1xuICBsZWZ0OiA1MCU7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpO1xufVxuIiwiKiB7XG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG59XG5cbmJvZHksXG5odG1sIHtcbiAgZm9udC1mYW1pbHk6IFJvYm90bywgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmICFpbXBvcnRhbnQ7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgbWFyZ2luOiAwO1xuICBwYWRkaW5nOiAwO1xufVxuXG4uYzMgdGV4dCB7XG4gIGZvbnQtZmFtaWx5OiBSb2JvdG8sIFwiSGVsdmV0aWNhIE5ldWVcIiwgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZiAhaW1wb3J0YW50O1xuICBmb250LXNpemU6IDE0cHg7XG59XG5cbmgxLFxuLmgxIHtcbiAgZm9udC1zaXplOiAyNHB4O1xuICBmb250LXdlaWdodDogNjAwO1xufVxuXG5oMixcbi5oMiB7XG4gIGZvbnQtc2l6ZTogMThweDtcbiAgZm9udC13ZWlnaHQ6IDUwMDtcbn1cblxuaDMsXG4uaDMge1xufVxuXG5wcmUge1xuICB3b3JkLWJyZWFrOiBicmVhay13b3JkO1xuICBvdmVyZmxvdy14OiBhdXRvO1xuICB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7XG4gIHdoaXRlLXNwYWNlOiAtbW96LXByZS13cmFwO1xuICB3aGl0ZS1zcGFjZTogLXByZS13cmFwO1xuICB3aGl0ZS1zcGFjZTogLW8tcHJlLXdyYXA7XG4gIHdvcmQtd3JhcDogYnJlYWstd29yZDtcbn1cblxuLmZvbnQtaXRhbGljLWxpZ2h0IHtcbiAgZm9udC13ZWlnaHQ6IDEwMDtcbiAgZm9udC1zdHlsZTogaXRhbGljO1xufVxuXG4udGV4dC1vdmVyZmxvdy1lbGxpcHNpcyB7XG4gIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xufVxuXG4ubGFiZWwsXG5sYWJlbCB7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBtYXJnaW4tYm90dG9tOiAxMHB4O1xuICBtYXJnaW4tdG9wOiAyMHB4O1xufVxuXG4uYmFkZ2UgPiAucGkge1xuICBwYWRkaW5nLXJpZ2h0OiA0cHg7XG59XG5cbmEuaWNvbi1saW5rOmxhc3Qtb2YtdHlwZSB7XG4gIHBhZGRpbmctcmlnaHQ6IDEwcHg7XG59XG5cbmEuaWNvbi1saW5rOmZpcnN0LW9mLXR5cGUge1xuICBwYWRkaW5nLWxlZnQ6IDEwcHg7XG59XG5cbmEuaWNvbi1saW5rIHtcbiAgZm9udC1zaXplOiAwLjg1ZW07XG4gIHBhZGRpbmc6IDAgNXB4O1xufVxuXG5ib2R5IC51aS13aWRnZXQtb3ZlcmxheSB7XG4gIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMCwgMCwgMCwgMC4yKTtcbiAgdHJhbnNpdGlvbjogYWxsIGxpbmVhciAwLjJzO1xufVxuXG4udWktc3RhdGUtaGlnaGxpZ2h0IGEuaWNvbi1saW5rIHtcbiAgY29sb3I6ICNmZmZmZmY7XG59XG5cbi51aS1zdGF0ZS1oaWdobGlnaHQgYS5pY29uLWxpbms6aG92ZXIge1xuICBjb2xvcjogI2ZmZmZmZmJhO1xufVxuXG4uZW1wdHktcGxhY2Vob2xkZXIge1xuICBjb2xvcjogIzk5OTtcbiAgZm9udC13ZWlnaHQ6IDEwMDtcbiAgcGFkZGluZzogMjBweCAwO1xuICAvKiBoZWlnaHQ6IDEwMCU7ICovXG4gIHRleHQtYWxpZ246IGNlbnRlcjtcbn1cblxuLnVpLXRvYXN0IHtcbiAgbWF4LWhlaWdodDogMTAwdmg7XG4gIG92ZXJmbG93LXk6IGF1dG87XG59XG5cbi51aS10b2FzdC1kZXRhaWwge1xuICB3b3JkLWJyZWFrOiBicmVhay13b3JkO1xufVxuXG4ubW9kYWwtZGlhbG9nLnVpLWRpYWxvZyB7XG4gIHdpZHRoOiA0MDBweDtcbn1cblxuLy8gQWRkIGJvdHRvbSBtYXJnaW4gdG8gcm93cyBpbiBkaWFsb2dzXG4udWktZGlhbG9nIC51aS1ncmlkIC51aS1ncmlkLXJvdyB7XG4gIG1hcmdpbi1ib3R0b206IDEwcHg7XG59XG5cbi51aS1kaWFsb2cgLnVpLWxpc3Rib3ggLnVpLWxpc3Rib3gtbGlzdC13cmFwcGVyIHtcbiAgbWF4LWhlaWdodDogY2FsYygxMDB2aCAtIDQwMHB4KTtcbiAgbWluLWhlaWdodDogMTAwcHg7XG59XG5cbmJvZHkgLnVpLWRpYWxvZyAudWktZGlhbG9nLWNvbnRlbnQge1xuICBtYXgtaGVpZ2h0OiBjYWxjKDEwMHZoIC0gMjAwcHgpO1xuICBtaW4taGVpZ2h0OiAyMDBweDtcbiAgb3ZlcmZsb3cteTogYXV0bztcbiAgb3ZlcmZsb3cteTogb3ZlcmxheTtcblxuICAtbXMtb3ZlcmZsb3ctc3R5bGU6IC1tcy1hdXRvaGlkaW5nLXNjcm9sbGJhcjtcblxuICBib3JkZXItbGVmdDogbm9uZTtcbiAgYm9yZGVyLXJpZ2h0OiBub25lO1xufVxuXG5ib2R5IC51aS1kaWFsb2cgLnVpLWRpYWxvZy10aXRsZWJhcixcbmJvZHkgLnVpLWRpYWxvZyAudWktZGlhbG9nLWZvb3RlciB7XG4gIGJvcmRlci1sZWZ0OiBub25lO1xuICBib3JkZXItcmlnaHQ6IG5vbmU7XG59XG5cbmJvZHkgLnVpLWRpYWxvZyAudWktZGlhbG9nLXRpdGxlYmFyIHtcbiAgYm9yZGVyLXRvcDogbm9uZTtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctZm9vdGVyIHtcbiAgYm9yZGVyLWJvdHRvbTogbm9uZTtcbn1cblxuLnVpLWRpYWxvZyAudWktbGlzdGJveCAudWktcHJvZ3Jlc3NiYXIge1xuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDE0cHg7XG4gIG1hcmdpbi10b3A6IDNweDtcbiAgbWFyZ2luLWJvdHRvbTogLTNweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzAwMDAwMDRhO1xufVxuXG4vLyBQcm9ncmVzcyBiYXIgaW4gbGlzdGJveCBpbiBkaWFsb2dzXG4udWktZGlhbG9nIC51aS1saXN0Ym94IC51aS1wcm9ncmVzc2JhciAudWktcHJvZ3Jlc3NiYXItbGFiZWwge1xuICBmb250LXNpemU6IDEycHg7XG4gIGxpbmUtaGVpZ2h0OiAxLjI1O1xuICBjb2xvcjogaW5oZXJpdDtcbn1cblxuLnVpLWRpYWxvZyAudWktbGlzdGJveCAudWktcHJvZ3Jlc3NiYXIgLnVpLXByb2dyZXNzYmFyLXZhbHVlIHtcbiAgYmFja2dyb3VuZDogIzAwMDAwMDZiO1xufVxuXG4vLyBPdmVyd3JpdGUgUHJpbWVORyBmb250c1xuYm9keSAudWktd2lkZ2V0LFxuYm9keVxuICAudWktYXV0b2NvbXBsZXRlLnVpLWF1dG9jb21wbGV0ZS1tdWx0aXBsZVxuICAudWktYXV0b2NvbXBsZXRlLW11bHRpcGxlLWNvbnRhaW5lclxuICAudWktYXV0b2NvbXBsZXRlLWlucHV0LXRva2VuXG4gIGlucHV0LFxuYm9keSAudWktY2hpcHMgPiB1bC51aS1pbnB1dHRleHQgLnVpLWNoaXBzLWlucHV0LXRva2VuIGlucHV0LFxuYm9keSAudWktdGFibGUgLnVpLWVkaXRhYmxlLWNvbHVtbiBpbnB1dCxcbmJvZHkgLnVpLXRyZWV0YWJsZSAudWktZWRpdGFibGUtY29sdW1uIGlucHV0LFxuYm9keSAudWktdGVybWluYWwgLnVpLXRlcm1pbmFsLWlucHV0IHtcbiAgZm9udC1mYW1pbHk6IFJvYm90bywgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmICFpbXBvcnRhbnQ7XG59XG5cbi8vIE92ZXJ3cml0ZSBQcmltZU5nIGNvbG91cnNcbmJvZHkgLnNlY29uZGFyeS1jb2wsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc2Vjb25kYXJ5LFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zZWNvbmRhcnkgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogIzMzMzMzMztcbiAgYmFja2dyb3VuZC1jb2xvcjogI2U4ZThlODtcbiAgYm9yZGVyLWNvbG9yOiAjZThlOGU4O1xufVxuYm9keSAuc2Vjb25kYXJ5LWNvbDpob3ZlcixcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zZWNvbmRhcnk6ZW5hYmxlZDpob3ZlcixcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc2Vjb25kYXJ5XG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjYzhjOGM4O1xuICBjb2xvcjogIzMzMzMzMztcbiAgYm9yZGVyLWNvbG9yOiAjYzhjOGM4O1xufVxuLy8gQ29sb3VycyBmcm9tIFByaW1lTkdcbmJvZHkgLnNlY29uZGFyeS1jb2w6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zZWNvbmRhcnk6ZW5hYmxlZDpmb2N1cyxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc2Vjb25kYXJ5XG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6Zm9jdXMge1xuICAtd2Via2l0LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICM4ZGNkZmY7XG4gIC1tb3otYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gIzhkY2RmZjtcbiAgYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gIzhkY2RmZjtcbn1cbmJvZHkgLnNlY29uZGFyeS1jb2w6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXNlY29uZGFyeTplbmFibGVkOmFjdGl2ZSxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc2Vjb25kYXJ5XG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6YWN0aXZlIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2EwYTBhMDtcbiAgY29sb3I6ICMzMzMzMzM7XG4gIGJvcmRlci1jb2xvcjogI2EwYTBhMDtcbn1cbmJvZHkgLmRlZmF1bHQtY29sLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWluZm8sXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWluZm8gPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzAwN2FkOTtcbiAgYm9yZGVyLWNvbG9yOiAjMDA3YWQ5O1xufVxuYm9keSAuZGVmYXVsdC1jb2w6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24taW5mbzplbmFibGVkOmhvdmVyLFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1pbmZvID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMTE2ZmJmO1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgYm9yZGVyLWNvbG9yOiAjMTE2ZmJmO1xufVxuYm9keSAuZGVmYXVsdC1jb2w6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1pbmZvOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWluZm8gPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpmb2N1cyB7XG4gIC13ZWJraXQtYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gIzhkY2RmZjtcbiAgLW1vei1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjOGRjZGZmO1xuICBib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjOGRjZGZmO1xufVxuYm9keSAuZGVmYXVsdC1jb2w6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWluZm86ZW5hYmxlZDphY3RpdmUsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWluZm8gPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA1YjlmO1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgYm9yZGVyLWNvbG9yOiAjMDA1YjlmO1xufVxuXG4vLyBTVWNjZXNzIGNvbFxuYm9keSAuc3VjY2Vzcy1jb2wsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc3VjY2VzcyxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2VzcyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdCB7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzRhODM1O1xuICBib3JkZXItY29sb3I6ICMzNGE4MzU7XG59XG5ib2R5IC5zdWNjZXNzLWNvbDpob3ZlcixcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zdWNjZXNzOmVuYWJsZWQ6aG92ZXIsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLXN1Y2Nlc3NcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICMxMDdkMTE7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBib3JkZXItY29sb3I6ICMxMDdkMTE7XG59XG5ib2R5IC5zdWNjZXNzLWNvbDplbmFibGVkOmZvY3VzLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3M6ZW5hYmxlZDpmb2N1cyxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2Vzc1xuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjYWFlNWFhO1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNhYWU1YWE7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNhYWU1YWE7XG59XG5ib2R5IC5zdWNjZXNzLWNvbDphY3RpdmUsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc3VjY2VzczplbmFibGVkOmFjdGl2ZSxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2Vzc1xuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmFjdGl2ZSB7XG4gIGJhY2tncm91bmQtY29sb3I6ICMwYzZiMGQ7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBib3JkZXItY29sb3I6ICMwYzZiMGQ7XG59XG5cbi8vIFNVY2Nlc3Mgb3V0bGluZVxuYm9keSAuc3VjY2Vzcy1jb2wtb3V0bGluZSxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zdWNjZXNzLW91dGxpbmUsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZSA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdCB7XG4gIGNvbG9yOiAjMzRhODM1O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xuICBib3JkZXItY29sb3I6ICNmZmY7XG59XG5ib2R5IC5zdWNjZXNzLWNvbC1vdXRsaW5lOmhvdmVyLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZTplbmFibGVkOmhvdmVyLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zdWNjZXNzLW91dGxpbmVcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGNvbG9yOiAjMTA3ZDExO1xuICBib3JkZXItY29sb3I6ICNmZmY7XG59XG5ib2R5IC5zdWNjZXNzLWNvbC1vdXRsaW5lOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZVxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjYWFlNWFhO1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNhYWU1YWE7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNhYWU1YWE7XG59XG5ib2R5IC5zdWNjZXNzLWNvbC1vdXRsaW5lOmFjdGl2ZSxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zdWNjZXNzLW91dGxpbmU6ZW5hYmxlZDphY3RpdmUsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZVxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmFjdGl2ZSB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGNvbG9yOiAjMGM2YjBkO1xuICBib3JkZXItY29sb3I6ICNmZmY7XG59XG5cbi8vIFdhcm5pbmcgY29sXG5ib2R5IC53YXJuaW5nLWNvbCxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi13YXJuaW5nLFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi13YXJuaW5nID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0IHtcbiAgY29sb3I6ICMzMzMzMzM7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmJhMDE7XG4gIGJvcmRlci1jb2xvcjogI2ZmYmEwMTtcbn1cbmJvZHkgLndhcm5pbmctY29sOmhvdmVyLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXdhcm5pbmc6ZW5hYmxlZDpob3ZlcixcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24td2FybmluZ1xuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2VkOTkwYjtcbiAgY29sb3I6ICMzMzMzMzM7XG4gIGJvcmRlci1jb2xvcjogI2VkOTkwYjtcbn1cbmJvZHkgLndhcm5pbmctY29sOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24td2FybmluZzplbmFibGVkOmZvY3VzLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi13YXJuaW5nXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6Zm9jdXMge1xuICAtd2Via2l0LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmZmVhYjQ7XG4gIC1tb3otYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2ZmZWFiNDtcbiAgYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2ZmZWFiNDtcbn1cbmJvZHkgLndhcm5pbmctY29sOmFjdGl2ZSxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi13YXJuaW5nOmVuYWJsZWQ6YWN0aXZlLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi13YXJuaW5nXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6YWN0aXZlIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2QzOGIxMDtcbiAgY29sb3I6ICMzMzMzMzM7XG4gIGJvcmRlci1jb2xvcjogI2QzOGIxMDtcbn1cblxuLy8gRGFuZ2VyIGNvbG91clxuYm9keSAuZGFuZ2VyLWNvbCxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXIsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlciA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdCB7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZTkxMjI0O1xuICBib3JkZXItY29sb3I6ICNlOTEyMjQ7XG59XG5ib2R5IC5kYW5nZXItY29sOmhvdmVyLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlcjplbmFibGVkOmhvdmVyLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXJcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNjMDExMjA7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBib3JkZXItY29sb3I6ICNjMDExMjA7XG59XG5ib2R5IC5kYW5nZXItY29sOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlclxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZjliNGJhO1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7XG59XG5ib2R5IC5kYW5nZXItY29sOmFjdGl2ZSxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXI6ZW5hYmxlZDphY3RpdmUsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlclxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmFjdGl2ZSB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNhOTAwMDA7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBib3JkZXItY29sb3I6ICNhOTAwMDA7XG59XG5cbi8vIERhbmdlciBvdXRsaW5lXG5ib2R5IC5kYW5nZXItY29sLW91dGxpbmUsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmUsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0IHtcbiAgY29sb3I6ICNlOTEyMjQ7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGJvcmRlci1jb2xvcjogI2ZmZjtcbn1cblxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lLFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZSA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdCB7XG4gIGJvcmRlci1jb2xvcjogI2U5MTIyNDtcbn1cblxuYm9keSAuZGFuZ2VyLWNvbC1vdXRsaW5lOmhvdmVyLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lOmVuYWJsZWQ6aG92ZXIsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xuICBjb2xvcjogI2MwMTEyMDtcbiAgYm9yZGVyLWNvbG9yOiAjZmZmO1xufVxuXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmU6ZW5hYmxlZDpob3ZlcixcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmVcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpob3ZlciB7XG4gIGJvcmRlci1jb2xvcjogI2MwMTEyMDtcbn1cblxuYm9keSAuZGFuZ2VyLWNvbC1vdXRsaW5lOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmU6ZW5hYmxlZDpmb2N1cyxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmVcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpmb2N1cyB7XG4gIC13ZWJraXQtYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2Y5YjRiYTtcbiAgLW1vei1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZjliNGJhO1xuICBib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZjliNGJhO1xufVxuYm9keSAuZGFuZ2VyLWNvbC1vdXRsaW5lOmFjdGl2ZSxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZTplbmFibGVkOmFjdGl2ZSxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmVcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xuICBjb2xvcjogI2E5MDAwMDtcbiAgYm9yZGVyLWNvbG9yOiAjZmZmO1xufVxuXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmU6ZW5hYmxlZDphY3RpdmUsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6YWN0aXZlIHtcbiAgYm9yZGVyLWNvbG9yOiAjYTkwMDAwO1xufVxuXG4vLyBPdmVycmlkaW5nIG90aGVyIFByaW1lTkcgc3R5bGVzXG5cbi8vIE1vdmluZyBtYXJnaW4gdG8gbGVmdCBzaWRlIC0gZnJvbSByaWdodCBmb3IgYnV0dG9ucyBpbiBkaWFsb2cvY2FyZCBmb290ZXJzXG5ib2R5IC51aS1kaWFsb2cgLnVpLWRpYWxvZy1mb290ZXIgYnV0dG9uLFxuYm9keSAudWktY2FyZCAudWktY2FyZC1mb290ZXIgYnV0dG9uIHtcbiAgbWFyZ2luOiAwIDAgMCAwLjVlbSAhaW1wb3J0YW50O1xufVxuXG5ib2R5IC51aS1kaWFsb2cge1xuICBib3gtc2hhZG93OiAwIDAgMCAycHggcmdiYSgwLCAwLCAwLCAwLjEpICFpbXBvcnRhbnQ7XG59XG5cbmJvZHkgLnVpLWRpYWxvZyAudWktZGlhbG9nLXRpdGxlYmFyIHtcbiAgYm9yZGVyLXJhZGl1czogNHB4IDRweCAwIDA7XG59XG5cbmJvZHkgLnVpLWRpYWxvZyAudWktZGlhbG9nLWZvb3RlciB7XG4gIGJvcmRlci1yYWRpdXM6IDAgMCA0cHggNHB4O1xufVxuXG4vLyBNYWtlIHVpIGVycm9yIG1lc3NhZ2VzIG1vcmUgYXR0cmFjdGl2ZVxuYm9keSAudWktbWVzc2FnZXMtZXJyb3Ige1xuICBib3JkZXI6IG5vbmU7XG4gIGZvbnQtd2VpZ2h0OiA4MDA7XG4gIHBhZGRpbmc6IDA7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICB3aWR0aDogMTAwJTtcblxuICB0ZXh0LWFsaWduOiByaWdodDtcblxuICAvLyBGcm9tIC51aS1pbnB1dHRleHQubmctZGlydHkubmctaW52YWxpZFxuICBjb2xvcjogI2E4MDAwMDtcbn1cblxuLy8gUmVtb3ZlIGxlZnQgcGFkZGluZyBmcm9tIGVycm9yIG1lc3NhZ2VzIFVMXG5ib2R5IC5uZy1kaXJ0eS5uZy1pbnZhbGlkICsgdWwge1xuICBwYWRkaW5nLWlubGluZS1zdGFydDogMDtcbn1cblxuLy8gTWFrZSBpbnZhbGlkIGlucHV0IGJvcmRlciByZWQgLSBldmVuIHdoZW4gZm9jdXNzZWRcbmJvZHkgLnVpLWlucHV0dGV4dC5uZy1pbnZhbGlkOmVuYWJsZWQ6Zm9jdXMsXG4udWktaW5wdXR0ZXh0IHtcbiAgYm9yZGVyLWNvbG9yOiAjYTgwMDAwO1xufVxuXG4vLyBBZGQgbGlnaHQgcmVkIG91dGxpbmUgdG8gaW52YWxpZCB0ZXh0IGlucHV0c1xuYm9keSAudWktaW5wdXR0ZXh0LFxuYm9keSAudWktaW5wdXRncm91cCAudWktaW5wdXR0ZXh0Lm5nLWRpcnR5Lm5nLWludmFsaWQgKyAudWktaW5wdXRncm91cC1hZGRvbiB7XG4gIHRyYW5zaXRpb246IGJveC1zaGFkb3cgMC4ycztcbn1cblxuYm9keSAudWktaW5wdXR0ZXh0Lm5nLWRpcnR5Lm5nLWludmFsaWQsXG5ib2R5IHAtZHJvcGRvd24ubmctZGlydHkubmctaW52YWxpZCA+IC51aS1kcm9wZG93bixcbmJvZHkgcC1hdXRvY29tcGxldGUubmctZGlydHkubmctaW52YWxpZCA+IC51aS1hdXRvY29tcGxldGUgPiAudWktaW5wdXR0ZXh0LFxuYm9keSBwLWNhbGVuZGFyLm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktY2FsZW5kYXIgPiAudWktaW5wdXR0ZXh0LFxuYm9keSBwLWNoaXBzLm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktaW5wdXR0ZXh0LFxuYm9keSBwLWlucHV0bWFzay5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLWlucHV0dGV4dCxcbmJvZHkgcC1jaGVja2JveC5uZy1kaXJ0eS5uZy1pbnZhbGlkIC51aS1jaGtib3gtYm94LFxuYm9keSBwLXJhZGlvYnV0dG9uLm5nLWRpcnR5Lm5nLWludmFsaWQgLnVpLXJhZGlvYnV0dG9uLWJveCxcbmJvZHkgcC1pbnB1dHN3aXRjaC5uZy1kaXJ0eS5uZy1pbnZhbGlkIC51aS1pbnB1dHN3aXRjaCxcbmJvZHkgcC1saXN0Ym94Lm5nLWRpcnR5Lm5nLWludmFsaWQgLnVpLWlucHV0dGV4dCxcbmJvZHkgcC1tdWx0aXNlbGVjdC5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLW11bHRpc2VsZWN0LFxuYm9keSBwLXNwaW5uZXIubmctZGlydHkubmctaW52YWxpZCA+IC51aS1pbnB1dHRleHQsXG5ib2R5IHAtc2VsZWN0YnV0dG9uLm5nLWRpcnR5Lm5nLWludmFsaWQgLnVpLWJ1dHRvbixcbmJvZHkgcC10b2dnbGVidXR0b24ubmctZGlydHkubmctaW52YWxpZCAudWktYnV0dG9uIHtcbiAgYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2Y5YjRiYTtcbn1cblxuLy8gRXh0ZW5kIHRleHQtZmllbGQgcmVkIG91dGxpbmUgdG8gYWRqYWNlbnQgbGFiZWxzIGFuZCBidXR0b25zXG5ib2R5IC51aS1pbnB1dGdyb3VwIC51aS1pbnB1dHRleHQubmctZGlydHkubmctaW52YWxpZCArIC51aS1pbnB1dGdyb3VwLWFkZG9uIHtcbiAgYm94LXNoYWRvdzogMnB4IC0yLjhweCAwICNmOWI0YmEsIDJweCAyLjhweCAwICNmOWI0YmE7XG59XG5cbmJvZHkgcC1jYWxlbmRhci5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLWNhbGVuZGFyLnVpLWNhbGVuZGFyLXctYnRuIHtcbiAgYm94LXNoYWRvdzogMCAwIDAgM3B4ICNmOWI0YmE7XG4gIGJvcmRlci1yYWRpdXM6IDRweDtcbn1cblxuYm9keVxuICAudWktaW5wdXRncm91cFxuICAudWktaW5wdXR0ZXh0OmVuYWJsZWQ6Zm9jdXM6bm90KC51aS1zdGF0ZS1lcnJvcilcbiAgKyAudWktaW5wdXRncm91cC1hZGRvbixcbmJvZHlcbiAgcC1jYWxlbmRhci5uZy1kaXJ0eS5uZy1pbnZhbGlkXG4gID4gLnVpLWNhbGVuZGFyXG4gID4gLnVpLWlucHV0dGV4dDplbmFibGVkOmZvY3VzOm5vdCgudWktc3RhdGUtZXJyb3IpLFxuYm9keVxuICBwLWNhbGVuZGFyLm5nLWRpcnR5Lm5nLWludmFsaWRcbiAgPiAudWktY2FsZW5kYXJcbiAgPiAudWktaW5wdXR0ZXh0OmVuYWJsZWQ6Zm9jdXM6bm90KC51aS1zdGF0ZS1lcnJvcilcbiAgKyAudWktY2FsZW5kYXItYnV0dG9uIHtcbiAgYm94LXNoYWRvdzogbm9uZTtcbn1cblxuLy8gRm9yY2UgMTAwJSB3aWR0aCBvbiB1aS10ZXh0LWlucHV0c1xuKjpub3QoLnVpLWNhbGVuZGFyKSAudWktaW5wdXR0ZXh0IHtcbiAgd2lkdGg6IDEwMCU7XG59XG5cbmJvZHkgLnVpLXN0YXRlLWRpc2FibGVkLFxuYm9keSAudWktd2lkZ2V0OmRpc2FibGVkIHtcbiAgY3Vyc29yOiBub3QtYWxsb3dlZDtcbn1cblxuLy8gU3R5bGVzIGZvciBGb3Jtc1xuXG4uZm9ybSBkeW5hbWljLXByaW1lbmctZm9ybS1jb250cm9sID4gZGl2IHtcbiAgbWFyZ2luLWJvdHRvbTogMTBweDtcbn1cblxuLmZvcm0gLnVpLWNhbGVuZGFyLFxuLmZvcm0gLnVpLXNwaW5uZXIge1xuICB3aWR0aDogMTAwJTtcbn1cblxuLy8gTWFrZSBwcmltZW5nIGNhbGVuZGFyIGlucHV0IHRleHRib3hlcyB0aGUgZnVsbCB3aWR0aCBvZiB0aGUgcG9wdXBcbi5mb3JtIC51aS1jYWxlbmRhci13LWJ0biBpbnB1dC51aS1pbnB1dHRleHQge1xuICB3aWR0aDogY2FsYygxMDAlIC0gMzNweCk7XG59XG5cbi8vIE1ha2UgRGF0ZXBpY2tlciBpbiBwb3B1cHMgYSBiaXQgc21hbGxlclxuLmZvcm0gLnVpLWRhdGVwaWNrZXIge1xuICBwYWRkaW5nOiAwLjVlbTtcbn1cblxuLmZvcm0gLnVpLWRhdGVwaWNrZXIge1xuICBmb250LXNpemU6IDEycHg7XG59XG5cbi5mb3JtIC51aS1kYXRlcGlja2VyIC51aS10aW1lcGlja2VyIHtcbiAgcGFkZGluZzogMTBweCAwIDAgMDtcbiAgZm9udC1zaXplOiAxMXB4O1xufVxuXG4uZm9ybSAudWktZGF0ZXBpY2tlciB0YWJsZSB7XG4gIGZvbnQtc2l6ZTogMTFweDtcbn1cblxuLy8gU2Nyb2xsYmFyIHN0eWxlXG5cbi8vIFNjcm9sbGJhciBhZGFwdGVkIGZyb20gaHR0cHM6Ly93d3cudzNzY2hvb2xzLmNvbS9ob3d0by9ob3d0b19jc3NfY3VzdG9tX3Njcm9sbGJhci5hc3Bcbi8qIHdpZHRoICovXG46Oi13ZWJraXQtc2Nyb2xsYmFyIHtcbiAgd2lkdGg6IDEwcHg7XG59XG5cbi8qIFRyYWNrICovXG46Oi13ZWJraXQtc2Nyb2xsYmFyLXRyYWNrIHtcbiAgYmFja2dyb3VuZDogbm9uZTtcbn1cblxuLyogSGFuZGxlICovXG46Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1iIHtcbiAgYmFja2dyb3VuZDogIzAwMDAwMDMzO1xuICBib3JkZXI6IDJweCBzb2xpZCByZ2JhKDAsIDAsIDAsIDApO1xuICBiYWNrZ3JvdW5kLWNsaXA6IHBhZGRpbmctYm94O1xuICBib3JkZXItcmFkaXVzOiA1cHg7XG59XG5cbi8qIEhhbmRsZSBvbiBob3ZlciAqL1xuOjotd2Via2l0LXNjcm9sbGJhci10aHVtYjpob3ZlciB7XG4gIGJhY2tncm91bmQ6ICMwMDAwMDA1NTtcbiAgYmFja2dyb3VuZC1jbGlwOiBwYWRkaW5nLWJveDtcbn1cbiIsIkBpbXBvcnQgXCIuLi8uLi8uLi9zdHlsZXMuc2Nzc1wiO1xuQGltcG9ydCBcIi4uL3N0eWxlcy9mYWtlLWxlYWZsZXQtY29udHJvbC5zY3NzXCI7XG5cbmJvZHkgLnVpLXNpZGViYXIge1xuICBAZXh0ZW5kIC5mYWtlLWxlYWZsZXQtY29udHJvbC1jb2xvdXJzO1xuICB6LWluZGV4OiAxNDAwICFpbXBvcnRhbnQ7XG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjNzIGN1YmljLWJlemllcigwLjQ1NSwgMC4wMywgMC41MTUsIDAuOTU1KTtcbiAgcGFkZGluZzogMDtcbiAgYm9yZGVyLXJhZGl1czogMDtcbn1cblxuYm9keSAudWktc2lkZWJhci1ib3R0b20ge1xuICBib3gtc2hhZG93OiAwIC04cHggMHB4IDJweCByZ2JhKDAsIDAsIDAsIDAuMik7XG59XG5cbmJvZHkgLnVpLXNpZGViYXItYm90dG9tLFxuYm9keSAudWktc2lkZWJhci10b3Age1xuICBoZWlnaHQ6IDMyMHB4O1xufVxuXG5ib2R5IC51aS1zaWRlYmFyLWxlZnQsXG5ib2R5IC51aS1zaWRlYmFyLXJpZ2h0IHtcbiAgd2lkdGg6IDMxM3B4O1xufVxuXG4udWktc2lkZWJhci53aWR0aC1maXQtY29udGVudCB7XG4gIHdpZHRoOiBmaXQtY29udGVudDtcbn1cblxuLnVpLXNpZGViYXIuaGVpZ2h0LWZpdC1jb250ZW50IHtcbiAgaGVpZ2h0OiBmaXQtY29udGVudDtcbn1cblxuLnVpLXNpZGViYXIud2lkdGgtZml0LWNvbnRlbnQgLnNpZGViYXItY29udGFpbmVyIHtcbiAgbWluLXdpZHRoOiAzMTNweDtcbiAgbWF4LXdpZHRoOiAxMDB2dztcbn1cblxuLy8gVGhpcyByZXNldHMgcGFkZGluZyAob3ZlcnJpZGRlbiBieSBwcmV2aW91cyBydWxlKSAtIGFuZCBzZXRzIHNjcm9sbCBib3ggdG8gc3RhcnQganVzdCBiZWxvdyBoMVxuLnNpZGViYXItY29udGFpbmVyIHtcbiAgaGVpZ2h0OiBjYWxjKDEwMCUgLSA1M3B4KTtcbiAgb3ZlcmZsb3cteTogYXV0bztcbiAgb3ZlcmZsb3cteTogb3ZlcmxheTtcbiAgLW1zLW92ZXJmbG93LXN0eWxlOiAtbXMtYXV0b2hpZGluZy1zY3JvbGxiYXI7XG4gIG92ZXJmbG93LXg6IGhpZGRlbjtcbn1cblxuLnNpZGViYXItcGFkZGluZyB7XG4gIHBhZGRpbmctdG9wOiAwLjU3MWVtO1xuICBwYWRkaW5nLXJpZ2h0OiAxZW07XG4gIHBhZGRpbmctYm90dG9tOiAwLjU3MWVtO1xuICBwYWRkaW5nLWxlZnQ6IDFlbTtcbn1cblxuLnNpZGViYXItZm9vdGVyIHtcbiAgYm9yZGVyLXRvcDogMXB4IHNvbGlkICNjOGM4Yzg7XG4gIGJhY2tncm91bmQ6ICNmNGY0ZjQ7XG59XG5cbmJvZHkgLnVpLXNpZGViYXIgLnVpLXNpZGViYXItY2xvc2Uge1xuICBwYWRkaW5nLXRvcDogMC41NzFlbTtcbiAgcGFkZGluZy1yaWdodDogMWVtO1xuICBwYWRkaW5nLWJvdHRvbTogMC41NzFlbTtcbiAgcGFkZGluZy1sZWZ0OiAxZW07XG4gIGZsb2F0OiBub25lO1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHJpZ2h0OiAwO1xuICB0b3A6IDA7XG59XG5cbmJvZHkgLnVpLXNpZGViYXIgaDEge1xuICBtYXJnaW4tYm90dG9tOiAwO1xuICBtYXJnaW4tdG9wOiAtOHB4O1xuICBwYWRkaW5nLXRvcDogMjNweDtcbiAgcGFkZGluZy1sZWZ0OiAxNXB4O1xuICBwYWRkaW5nLWJvdHRvbTogMC42N2VtO1xuICBwYWRkaW5nLXJpZ2h0OiAxMDBweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2Y0ZjRmNDtcbiAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNjOGM4Yzg7XG59XG5cbkBtZWRpYSAobWluLXdpZHRoOiA3NjhweCkge1xuICBib2R5IC5zaWRlYmFyLWNvbnRhaW5lciAudWktb3JkZXJsaXN0LWNvbnRyb2xzLXJpZ2h0IHtcbiAgICBtYXJnaW4tcmlnaHQ6IC0xNXB4O1xuICB9XG59XG5cbi8vIENoYW5nZSBvcmRlcmxpc3QgY29udHJvbCBidXR0b25zXG5ib2R5IC51aS1vcmRlcmxpc3QgLnVpLW9yZGVybGlzdC1jb250cm9scyBidXR0b24ge1xuICBAZXh0ZW5kIC5zZWNvbmRhcnktY29sO1xufVxuXG5ib2R5IC51aS1vcmRlcmxpc3QgLnVpLW9yZGVybGlzdC1jb250cm9scyBidXR0b246aG92ZXIge1xuICBAZXh0ZW5kIC5zZWNvbmRhcnktY29sOmhvdmVyO1xufVxuXG5ib2R5IC51aS1vcmRlcmxpc3QgLnVpLW9yZGVybGlzdC1jb250cm9scyBidXR0b246Zm9jdXMge1xuICBAZXh0ZW5kIC5zZWNvbmRhcnktY29sOmZvY3VzO1xufVxuXG5ib2R5IC51aS1vcmRlcmxpc3QgLnVpLW9yZGVybGlzdC1jb250cm9scyBidXR0b246YWN0aXZlIHtcbiAgQGV4dGVuZCAuc2Vjb25kYXJ5LWNvbDphY3RpdmU7XG59XG5cbi8vIFNsaWdodGx5IGRhcmtlbnMgdGhlICdkZWZhdWx0JyBjb2xvciAtIHdoZW4gaXQgaXMgY29udGFpbmVkIHdpdGhpbiBhIGhpZ2hsaWdodGVkIGVsZW1lbnQgKGkuZS4gYSBzZWxlY3RlZCBsaXN0IGl0ZW0gaW4gdGhlIGxheWVyIG9yZGVyIGxpc3QpXG4udWktc3RhdGUtaGlnaGxpZ2h0IGEuaWNvbi10b2dnbGUuZGVmYXVsdC1jb2wge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA2NWIzO1xufVxuIiwiQGltcG9ydCBcIi4vc3R5bGVzL2Zha2UtbGVhZmxldC1jb250cm9sLnNjc3NcIjtcbkBpbXBvcnQgXCIuL3N0eWxlcy9zaWRlYmFyLnNjc3NcIjtcbi8vICRtZW51YmFyLWhlaWdodDogMzBweDtcblxuI2Nvbm5lY3Rpb24tc3RhdHVzIHtcbiAgQGV4dGVuZCAuZmFrZS1sZWFmbGV0LWNvbnRyb2wtY29sb3VycztcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDEwcHg7XG4gIGxlZnQ6IDUwJSAhaW1wb3J0YW50O1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XG4gIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgei1pbmRleDogMTMwMDtcbiAgcGFkZGluZzogNXB4IDEwcHg7XG4gIGJhY2tncm91bmQtY2xpcDogcGFkZGluZy1ib3g7XG4gIGZvbnQtc2l6ZTogMTRweDtcbn1cblxuI2Nvbm5lY3Rpb24tc3RhdHVzLmRpc2Nvbm5lY3RlZCB7XG4gIGNvbG9yOiBjcmltc29uO1xufVxuXG4jY29ubmVjdGlvbi1zdGF0dXMuY29ubmVjdGVkIHtcbiAgY29sb3I6ICMwMGJiODg7XG59XG5cbiN0b3AtbGVmdC1jb250cm9scyB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgdG9wOiAxMHB4O1xuICBsZWZ0OiAxMHB4O1xuICB6LWluZGV4OiAxMzAwO1xufVxuXG5ib2R5IC5nZW93ZWItbWVudS51aS1zbGlkZW1lbnUge1xuICBAZXh0ZW5kIC5mYWtlLWxlYWZsZXQtY29udHJvbC1jb2xvdXJzO1xuICB3aWR0aDogMTkwcHg7XG4gIG1hcmdpbi10b3A6IDE0cHg7XG4gIGJvcmRlcjogbm9uZTtcbn1cblxuYm9keSAudWktc2xpZGVtZW51IC51aS1zbGlkZW1lbnUtY29udGVudCB7XG4gIGJvcmRlci1yYWRpdXM6IDRweDtcbn1cblxuLy8gVEhpcyBpcyB1bnVzZWQgY3VycmVudGx5IC0gYXMgdGhlIG1lbnViYXIgd2FzIHJlcGxhY2VkIHdpdGggdGhlIHBvcHVwIG1lbnVcblxuLy8gLmdlb3dlYi1tZW51YmFyIHtcbi8vICAgcG9zaXRpb246IGFic29sdXRlO1xuLy8gICB0b3A6IDA7XG4vLyAgIGxlZnQ6IDA7XG4vLyAgIHotaW5kZXg6IDE1MDA7XG4vLyAgIGJvcmRlcjogbm9uZSAhaW1wb3J0YW50O1xuLy8gICB3aWR0aDogMTAwdnc7XG4vLyAgIGJveC1zaGFkb3c6IDAgMCAwcHggMnB4IHJnYmEoMCwgMCwgMCwgMC4yKTtcblxuLy8gICBoZWlnaHQ6ICRtZW51YmFyLWhlaWdodDtcbi8vIH1cblxuLy8gLnVpLW1lbnViYXIuZ2Vvd2ViLW1lbnViYXIsXG4vLyAudWktbWVudWJhci5nZW93ZWItbWVudWJhciAudWktbWVudWl0ZW0gPiAudWktbWVudWl0ZW0tbGluayAudWktbWVudWl0ZW0tdGV4dCxcbi8vIC51aS1tZW51YmFyLmdlb3dlYi1tZW51YmFyIC51aS1tZW51aXRlbS1saW5rLFxuLy8gLnVpLW1lbnViYXIuZ2Vvd2ViLW1lbnViYXIgLnVpLW1lbnVpdGVtLWxpbmsgLnVpLW1lbnVpdGVtLWljb24ge1xuLy8gICBib3JkZXItcmFkaXVzOiAwO1xuLy8gICAvLyBjb2xvcjogI2ZmZiAhaW1wb3J0YW50O1xuLy8gICBmb250LXNpemU6IDEzcHg7XG4vLyAgIC8vIGJhY2tncm91bmQtY29sb3I6ICMzMzM4M2I7XG4vLyB9XG5cbi8vIGJvZHkgLnVpLW1lbnViYXIuZ2Vvd2ViLW1lbnViYXIgLnVpLW1lbnVpdGVtID4gLnVpLW1lbnVpdGVtLWxpbmsge1xuLy8gICBwYWRkaW5nOiA0cHggMTVweDtcbi8vIH1cblxuLy8gLnVpLW1lbnViYXIuZ2Vvd2ViLW1lbnViYXIgLnVpLXN1Ym1lbnUtbGlzdCB7XG4vLyAgIC8vIGJhY2tncm91bmQtY29sb3I6ICMzMzM4M2I7XG4vLyAgIC8vIGJvcmRlcjogMXB4IHNvbGlkICMyMjI1MjY7XG4vLyAgIGJvcmRlci1yYWRpdXM6IDA7XG4vLyB9XG5cbi8vIC51aS1tZW51YmFyLmdlb3dlYi1tZW51YmFyIC51aS1tZW51aXRlbS1saW5rOmhvdmVyLFxuLy8gLnVpLW1lbnViYXIuZ2Vvd2ViLW1lbnViYXIgLnVpLW1lbnVpdGVtLnVpLW1lbnVpdGVtLWFjdGl2ZSA+IC51aS1tZW51aXRlbS1saW5rLFxuLy8gLnVpLW1lbnViYXIuZ2Vvd2ViLW1lbnViYXJcbi8vICAgLnVpLW1lbnVpdGVtLnVpLW1lbnVpdGVtLWFjdGl2ZVxuLy8gICA+IC51aS1tZW51aXRlbS1saW5rXG4vLyAgIC51aS1tZW51aXRlbS10ZXh0LFxuLy8gLnVpLW1lbnViYXIuZ2Vvd2ViLW1lbnViYXJcbi8vICAgLnVpLW1lbnVpdGVtLnVpLW1lbnVpdGVtLWFjdGl2ZVxuLy8gICA+IC51aS1tZW51aXRlbS1saW5rXG4vLyAgIC51aS1tZW51aXRlbS1pY29uLFxuLy8gLnVpLW1lbnViYXIuZ2Vvd2ViLW1lbnViYXJcbi8vICAgLnVpLW1lbnVpdGVtLnVpLW1lbnVpdGVtLWFjdGl2ZVxuLy8gICA+IC51aS1tZW51aXRlbS1saW5rXG4vLyAgIC51aS1zdWJtZW51LWljb24ge1xuLy8gICAvLyBjb2xvcjogI2ZmZmZmZiAhaW1wb3J0YW50O1xuLy8gICAvLyBiYWNrZ3JvdW5kLWNvbG9yOiAjMjIyNTI2ICFpbXBvcnRhbnQ7XG4vLyB9XG5cbi5nZW93ZWItY29udGFpbmVyIHtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbn1cblxuLy8gU3RhcnQgZGlhbG9nIG1vZGFsXG5cbi51aS13aWRnZXQtb3ZlcmxheS51aS1kaWFsb2ctbWFzayB7XG4gIHotaW5kZXg6IDE1MDAgIWltcG9ydGFudDtcbn1cblxuLnVpLWRpYWxvZyB7XG4gIHotaW5kZXg6IDE1MDEgIWltcG9ydGFudDtcbn1cblxuLmxvZy1zaWRlYmFyIC5zaWRlYmFyLWNvbnRhaW5lci5sb2ctbWVzc2FnZXMtY29udGFpbmVyIHtcbiAgbWF4LWhlaWdodDogY2FsYygxMDAlIC0gMTIxcHgpO1xuICBvdmVyZmxvdy15OiBhdXRvO1xuICBvdmVyZmxvdy15OiBvdmVybGF5O1xuICAtbXMtb3ZlcmZsb3ctc3R5bGU6IC1tcy1hdXRvaGlkaW5nLXNjcm9sbGJhcjtcbiAgb3ZlcmZsb3cteDogdmlzaWJsZTtcbiAgcGFkZGluZy10b3A6IDFlbTtcbn1cblxuLmxvZy1zaWRlYmFyID4gcC1idXR0b24ge1xuICBtYXJnaW4tbGVmdDogMWVtICFpbXBvcnRhbnQ7XG4gIG1hcmdpbi1yaWdodDogMWVtICFpbXBvcnRhbnQ7XG59XG5cbi5sb2ctbWVzc2FnZSB7XG4gIGxpbmUtaGVpZ2h0OiAxLjI7XG4gIG1hcmdpbjogMDtcbiAgZm9udC1mYW1pbHk6IG1vbm9zcGFjZTtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBwYWRkaW5nLWJvdHRvbTogMTBweDtcbiAgd29yZC1icmVhazogYnJlYWstd29yZDtcbn1cblxuLmpvYi1jb250cm9sLWJ1dHRvbnMge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGJvdHRvbTogMDtcbiAgbGVmdDogMDtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogNTBweDtcbn1cblxuLnVpLWxpc3Rib3gubG9hZC1qb2ItbGlzdCBsaS51aS1saXN0Ym94LWl0ZW0ge1xuICBkaXNwbGF5OiBncmlkICFpbXBvcnRhbnQ7XG4gIGdyaWQtdGVtcGxhdGUtY29sdW1uczogbWlubWF4KG1pbi1jb250ZW50LCBhdXRvKSBhdXRvIG1heC1jb250ZW50O1xuICBncmlkLWdhcDogMTBweDtcbn1cblxuLnVpLWxpc3Rib3gubG9hZC1qb2ItbGlzdCBsaS51aS1saXN0Ym94LWl0ZW0gPiBzcGFuIHtcbiAgbWF4LXdpZHRoOiAyOTZweDtcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG59XG4iXX0= */"

/***/ }),

/***/ "./src/app/geo-web/geoweb.component.ts":
/*!*********************************************!*\
  !*** ./src/app/geo-web/geoweb.component.ts ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const web_socket_service_1 = __webpack_require__(/*! ../services/web-socket.service */ "./src/app/services/web-socket.service.ts");
const job_service_service_1 = __webpack_require__(/*! ../services/job-service.service */ "./src/app/services/job-service.service.ts");
const rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm2015/index.js");
const message_api_1 = __webpack_require__(/*! ../../../../shared/src/message-api */ "../shared/src/message-api/index.ts");
const flash_message_service_1 = __webpack_require__(/*! ../services/flash-message.service */ "./src/app/services/flash-message.service.ts");
const disclaimer_service_1 = __webpack_require__(/*! ../disclaimer/disclaimer-service */ "./src/app/disclaimer/disclaimer-service.ts");
const router_1 = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm2015/router.js");
const string_1 = __webpack_require__(/*! ../../../../shared/src/util/string */ "../shared/src/util/string.ts");
const keypress_1 = __webpack_require__(/*! ../util/keypress */ "./src/app/util/keypress.ts");
const primeng_1 = __webpack_require__(/*! primeng/primeng */ "./node_modules/primeng/primeng.js");
const auth_service_1 = __webpack_require__(/*! ../services/auth.service */ "./src/app/services/auth.service.ts");
const spinner_service_service_1 = __webpack_require__(/*! ../spinner/spinner-service.service */ "./src/app/spinner/spinner-service.service.ts");
const config_service_1 = __webpack_require__(/*! ../services/config.service */ "./src/app/services/config.service.ts");
const server_config_form_model_1 = __webpack_require__(/*! ./server-config-form-model */ "./src/app/geo-web/server-config-form-model.ts");
const job_base_1 = __webpack_require__(/*! ../../../../shared/src/job/job-base */ "../shared/src/job/job-base.ts");
const job_types_1 = __webpack_require__(/*! ../../../../shared/src/job/job-types */ "../shared/src/job/job-types.ts");
const rest_api_service_1 = __webpack_require__(/*! ../services/rest-api.service */ "./src/app/services/rest-api.service.ts");
const map_component_1 = __webpack_require__(/*! ../geo-web/map/map.component */ "./src/app/geo-web/map/map.component.ts");
/**
 * Main component for Geoweb (after user in authenticated, disclaimer agreed...)
 * Handles job related functionality: Create new job, load job, edit job config form, view logs.
 * It also handles the menu and editing server config.
 * This component contains the FileDropUploadComponent, the main SpinnerComponent and the FileBrowserComponent
 *
 * @export
 * @class GeowebComponent
 */
let GeowebComponent = class GeowebComponent {
    constructor(disclaimerService, router, webSocketService, jobService, flashMessageService, spinnerService, authService, configService, restApiService) {
        this.disclaimerService = disclaimerService;
        this.router = router;
        this.webSocketService = webSocketService;
        this.jobService = jobService;
        this.flashMessageService = flashMessageService;
        this.spinnerService = spinnerService;
        this.authService = authService;
        this.configService = configService;
        this.restApiService = restApiService;
        this.wsConnected = false;
        this.logs = [];
        this.availableJobs = [];
        this.availableJobTemplates = [];
        this.availableJobTypes = [];
        this.jobTypeDescriptionsMap = job_types_1.jobTypeDescriptions.reduce((current, jobTypeDesc) => {
            return Object.assign(current, { [jobTypeDesc.type]: jobTypeDesc });
        }, {});
        this.newJobDialogVisible = false;
        this.newJob = { name: "", type: "", templateName: "" };
        this.getJobDialogVisible = false;
        this.getJob = { name: "" };
        this.showCommandTextbox = false;
        this.showConfigController = false;
        this.showLoggingController = false;
        this.firstJobLoaded = false;
        this.firstJob = true;
        this.onKeypress = keypress_1.onKeypress;
        this.isAdmin = false;
        this.customFormValidators = {
            integerValidator: string_1.integerValidator,
            floatValidator: string_1.floatValidator,
            alphaNumericDashesValidator: string_1.alphaNumericDashesValidator,
        };
        // Server config form props
        this.serverConfigForm = server_config_form_model_1.serverConfigForm;
        this.serverConfigFormSubmitSubject = new rxjs_1.Subject();
        this.serverConfigFormIsValid = false;
        this.showServerConfigController = false;
        // Check if logged in and disclaimer agreedto
        if (!this.authService.isLoggedIn) {
            this.router.navigate(["/"]);
        }
        else if (!this.disclaimerService.disclaimerAgreedTo) {
            this.router.navigate(["/"]);
        }
        else {
            this.updateMenuItems();
        }
        this.debugMode = this.configService.debugMode;
        this.wsConnectedSubscription = this.webSocketService
            .getAuthenticatedAsObservable()
            .subscribe(authenticated => {
            this.wsConnected = authenticated;
            if (authenticated) {
                this.spinnerService.removeSpinner(`geoweb-component-authenticated`);
                this.isAdmin = this.authService.isAdmin;
                this.serverConfigSubject = this.webSocketService.getServerConfigSubject();
            }
            else {
                this.spinnerService.setSpinner(`geoweb-component-authenticated`, {
                    name: `Connecting to Master`,
                    icon: spinner_service_service_1.SpinnerIcon.RotatingCircle,
                });
            }
        });
        this.jobSubject = this.jobService.getCurrentJobBehaviourSubject();
        this.jobSubscription = this.jobSubject.subscribe(job => {
            if (this.configService.debugMode) {
                console.log(job);
            }
            if (typeof job !== "undefined") {
                this.onJobUpdated(job);
            }
        });
        this.logsSubscription = this.jobService
            .getLogsObservable()
            .subscribe(logs => (this.logs = logs));
        this.availableJobsSubscription = this.jobService
            .getAvailableJobsObservable()
            .subscribe(jobList => {
            this.availableJobs = jobList
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(job => {
                return { value: job };
            });
            if (this.getJobDialogVisible) {
                this.getJobDialog.center();
            }
        });
        this.availableJobTemplatesSubscription = this.jobService
            .getAvailableJobTemplatesObservable()
            .subscribe(templateList => {
            this.availableJobTemplates = templateList
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(template => {
                return { value: template };
            });
            if (this.newJobDialogVisible) {
                this.newJobDialog.center();
            }
        });
        this.availableJobTypes = job_types_1.jobTypeDescriptions.map(jobType => {
            return { value: jobType, label: jobType.label };
        });
        this.newJobSelectedJobType = this.availableJobTypes[0];
    }
    // Handle escape key presses
    handleKeyboardEvent(event) {
        if (event.key === "Escape") {
            if (this.getJobDialogVisible) {
                this.cancelGetJobDialog();
                event.stopImmediatePropagation();
            }
            else if (this.newJobDialogVisible) {
                this.cancelNewJobDialog();
                event.stopImmediatePropagation();
            }
            else if (this.showLoggingController) {
                this.showLoggingController = false;
                event.stopImmediatePropagation();
            }
            else if (this.showConfigController) {
                this.showConfigController = false;
                event.stopImmediatePropagation();
            }
            else if (this.mainMenu.visible) {
                this.mainMenu.hide();
                event.stopImmediatePropagation();
            }
        }
    }
    get debugMode() {
        return this.configService.debugMode;
    }
    set debugMode(mode) {
        this.configService.debugMode = mode;
    }
    ngOnInit() { }
    ngOnDestroy() {
        // unsubscribe to ensure no memory leaks
        this.wsConnectedSubscription.unsubscribe();
        this.jobSubscription.unsubscribe();
        this.logsSubscription.unsubscribe();
        this.availableJobsSubscription.unsubscribe();
        this.availableJobTemplatesSubscription.unsubscribe();
        this.spinnerService.removeSpinner(`current-job-running`);
        this.spinnerService.removeSpinnersStartWith(`geoweb-component`);
    }
    ngAfterViewInit() {
        this.initCommandTextbox();
    }
    onJobUpdated(job) {
        return __awaiter(this, void 0, void 0, function* () {
            const init = typeof this.currentJob === "undefined" ||
                this.currentJob.name !== job.name;
            const statusChanged = typeof this.currentJobStatus !== "undefined" &&
                job.status !== this.currentJobStatus;
            this.currentJob = job;
            this.currentJobStatus = job.status;
            if (init) {
                this.spinnerService.removeSpinnersStartWith(`current-job`);
                this.updateMenuItems();
                if (this.debugMode) {
                    this.flashMessageService.pushFlashMessage(new message_api_1.FlashMessage({
                        duration: 6000,
                        severity: "info",
                        title: "Job Loaded",
                        message: "Job " + this.currentJob.name + " is loaded.",
                    }));
                }
                // If job status has changed - show/hide spinner and display messages
            }
            else if (statusChanged) {
                this.updateMenuItems();
                // Display any errors
                if (this.currentJob.status === job_base_1.JobStatus.ERROR) {
                    // Note: this message will show with debugMode = false | true
                    this.flashMessageService.pushFlashMessage(new message_api_1.FlashMessage({
                        title: "An Error has occurred",
                        message: `Job ${this.currentJob.name} failed. See Logs for more info.`,
                        sticky: true,
                    }));
                    // If running
                }
                else if (this.currentJob.status === job_base_1.JobStatus.STARTING) {
                    this.showConfigController = false;
                }
                // Otherwise -  only display messages if DebugMode is true
                if (this.debugMode) {
                    if (this.currentJob.status === job_base_1.JobStatus.RUNNING) {
                        this.flashMessageService.pushFlashMessage(new message_api_1.FlashMessage({
                            title: "Job running",
                            message: `Job ${this.currentJob.name} has successfully started. See Logs for more info.`,
                            severity: "warn",
                        }));
                    }
                    else if (this.currentJob.status === job_base_1.JobStatus.INACTIVE) {
                        this.flashMessageService.pushFlashMessage(new message_api_1.FlashMessage({
                            title: "Job stopped",
                            message: `Job ${this.currentJob.name} is now stopped.`,
                            severity: "info",
                        }));
                    }
                    else if (this.currentJob.status === job_base_1.JobStatus.FINISHED) {
                        this.flashMessageService.pushFlashMessage(new message_api_1.FlashMessage({
                            title: "Job finished",
                            message: `Job ${this.currentJob.name} has completed.`,
                            severity: "success",
                        }));
                    }
                    else {
                        this.flashMessageService.pushFlashMessage(new message_api_1.FlashMessage({
                            title: "Job status updated",
                            message: `Job ${this.currentJob.name} status updated to ${this.currentJob.status.toString()}`,
                            severity: "info",
                        }));
                    }
                }
            }
            // If job is running, queued or starting -> show spinner
            if (this.currentJob.status === job_base_1.JobStatus.RUNNING ||
                this.currentJob.status === job_base_1.JobStatus.QUEUED ||
                this.currentJob.status === job_base_1.JobStatus.STARTING) {
                this.spinnerService.setSpinner(`current-job-running`, {
                    name: `Job is ${job.status}`,
                    icon: spinner_service_service_1.SpinnerIcon.Fire,
                    progress: job.progress,
                });
            }
            else {
                this.spinnerService.removeSpinner(`current-job-running`);
            }
        });
    }
    showNewJobDialog() {
        this.webSocketService.updateAvailableJobLists();
        this.newJob = { name: "", type: "", templateName: "" };
        this.newJobDialogVisible = true;
    }
    submitNewJobDialog() {
        if (this.newJobNameInput.errors) {
            return false;
        }
        //if (!this.firstJob) {
        //console.log("not first job")
        if (typeof this.currentJob === "undefined") {
            console.log("first job");
        }
        else {
            console.log("not first job");
            this.currentJob.removeTripsLayer();
        }
        //}
        // console.log("status" + this.firstJob)
        this.geoweb.clearPopLegends();
        this.geoweb.stopCurrentSimulation();
        this.firstJob = false;
        this.newJob.templateName =
            typeof this.newJobSelectedJobTemplate !== "undefined" &&
                this.newJobSelectedJobTemplate !== null &&
                "name" in this.newJobSelectedJobTemplate
                ? this.newJobSelectedJobTemplate.name
                : undefined;
        this.newJob.type = this.newJobSelectedJobType.value.type;
        this.webSocketService.newJob(this.newJob);
        this.newJobDialogVisible = false;
        this.newJob = { name: "", type: "", templateName: "" };
        this.webSocketService.clearUpdateAvailableJobListInterval();
    }
    cancelNewJobDialog() {
        this.newJobDialogVisible = false;
        this.newJob = { name: "", type: "", templateName: "" };
    }
    showGetJobDialog() {
        if (this.isAdmin) {
            this.webSocketService.updateAvailableJobLists(1000);
        }
        this.getJob = { name: "" };
        this.getJobDialogVisible = true;
    }
    cancelGetJobDialog() {
        this.getJobDialogVisible = false;
        this.getJob = { name: "" };
        this.webSocketService.clearUpdateAvailableJobListInterval();
    }
    submitGetJobDialog() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this.getJobSelectedJob === "undefined") {
                return false;
            }
            if (this.firstJobLoaded) {
                if (this.currentJob.type == "emv2") {
                    this.geoweb.stopCurrentSimulation();
                    this.geoweb.changeClockStart();
                    this.currentJob.removeTripsLayer();
                    this.geoweb.clearPopLegends();
                    //await this.geoweb.initMapbox()
                    console.log("loading second time");
                }
            }
            this.loadSelectedJob();
        });
    }
    loadSelectedJob() {
        this.getJob.name = this.getJobSelectedJob.name;
        this.webSocketService.getJob(this.getJob);
        this.getJobDialogVisible = false;
        this.getJob = { name: "" };
        this.webSocketService.clearUpdateAvailableJobListInterval();
        this.firstJobLoaded = true;
    }
    runJob(name = "") {
        if (typeof this.currentJob === "undefined" || this.currentJob.clientOnly)
            return;
        // if (this.currentJob.canJobRun()) {
        // if (name === "") {
        //   this.webSocketService.runJob({
        //     job: this.currentJob.toJSON(),
        //   })
        // } else {
        //   this.webSocketService.runJob({
        //     job: name,
        //   })
        // }
        // }
        //console.log(this.geoweb.getConfig().region)
        //this.currentJob["region"] = this.geoweb.getConfig().region
        this.finalJobJSON = this.currentJob.toJSON();
        //let config = this.geoweb.getConfig()
        this.geoweb.getConfig().then(config => {
            //console.log("config received" + config.region)
            this.finalJobJSON["region"] = config.region;
            this.finalJobJSON["population"] = config.population;
            this.finalJobJSON["fire"] = config.fire;
            this.finalJobJSON["evacMessage"] = config.evacMessage;
            this.finalJobJSON["speed"] = config.speed;
            this.finalJobJSON["time"] = config.time;
            this.finalJobJSON["crs"] = config.crs;
            this.finalJobJSON["evacMessagelist"] = config.finalMessageList;
            // DSS:Invoke runJob and send the config file to server 
            this.webSocketService.runJob({
                job: this.finalJobJSON,
            });
            //DSS: Load spinner 
            this.spinnerService.setSpinner(`current-job-running`, {
                name: `Job is ${this.currentJob.status}`,
                icon: spinner_service_service_1.SpinnerIcon.Fire,
                progress: this.currentJob.progress,
            });
            //console.log("fina job" + this.finalJobJSON)
        });
    }
    updateJobLists() {
        this.webSocketService.updateAvailableJobLists();
    }
    stopJob(name = "") {
        if (name === "") {
            this.webSocketService.stopJob({
                name: this.currentJob.name,
            });
        }
        else {
            this.webSocketService.stopJob({
                name,
            });
        }
    }
    deleteJob(name = "") {
        if (name === "") {
            this.webSocketService.deleteJob({
                name: this.currentJob.name,
            });
        }
        else {
            this.webSocketService.deleteJob({
                name,
            });
        }
    }
    onServerConfigValid(event) {
        this.serverConfigFormIsValid = event;
    }
    updateServerConfig() {
        this.webSocketService.updateServerConfig();
        this.showServerConfigController = false;
    }
    // This monstrosity is needed to fix doubleclicking menu items redirecting to '#' (and therefore reloading the page)
    menuItemClickHandler(fn) {
        const self = this;
        return evt => {
            evt.originalEvent.target.onclick = clickEvent => clickEvent.preventDefault();
            fn.bind(self)();
            return false;
        };
    }
    updateMenuItems() {
        this.menuItems = [
            {
                label: "Job",
                items: [
                    {
                        label: "New",
                        icon: "pi pi-fw pi-plus",
                        command: this.menuItemClickHandler(this.showNewJobDialog),
                    },
                    {
                        label: "Load",
                        icon: "pi pi-fw pi-folder-open",
                        command: this.menuItemClickHandler(this.showGetJobDialog),
                    },
                    {
                        label: "Edit",
                        icon: "pi pi-fw pi-pencil",
                        command: this.menuItemClickHandler(() => (this.showConfigController = true)),
                        visible: typeof this.currentJob !== "undefined",
                    },
                    {
                        label: "Run",
                        icon: "pi pi-fw pi-caret-right",
                        command: this.menuItemClickHandler(this.runJob),
                        visible: typeof this.currentJob !== "undefined" &&
                            this.currentJob.status !== job_base_1.JobStatus.RUNNING,
                    },
                    {
                        label: "Stop",
                        icon: "pi pi-fw pi-times",
                        command: this.menuItemClickHandler(this.stopJob),
                        visible: typeof this.currentJob !== "undefined" &&
                            this.currentJob.status === job_base_1.JobStatus.RUNNING,
                    },
                ],
            },
            {
                label: "View",
                items: [
                    {
                        label: "Show Logs",
                        icon: "pi pi-fw pi-align-left",
                        command: this.menuItemClickHandler(() => (this.showLoggingController = true)),
                        visible: typeof this.currentJob !== "undefined",
                    },
                    {
                        label: this.debugMode ? "Disable Debug" : "Enable Debug",
                        icon: this.debugMode ? "pi pi-fw pi-eye-slash" : "pi pi-fw pi-eye",
                        command: this.menuItemClickHandler(() => {
                            this.debugMode = !this.debugMode;
                            this.updateMenuItems();
                        }),
                    },
                ],
            },
            {
                label: "Options",
                icon: "pi pi-fw pi-cog",
                command: this.menuItemClickHandler(() => (this.showServerConfigController = true)),
                visible: this.authService.isAdmin,
            },
            {
                label: "Logout",
                icon: "pi pi-fw pi-power-off",
                command: this.menuItemClickHandler(() => {
                    this.authService.logout();
                    setTimeout(() => this.router.navigate(["/"]), 500);
                }),
            },
        ];
    }
    // This isn't used anymore
    initCommandTextbox() {
        const commandTb = (document.getElementById("command-textbox"));
        commandTb.onkeypress = e => {
            if (e.key === "Enter") {
                const commandSplit = commandTb.value.split(" ");
                switch (commandSplit[0]) {
                    case "get-job":
                        if (commandSplit.length < 2) {
                            const invalidCommandErrorMessage = new message_api_1.FlashMessage({
                                title: "Invalid Command",
                                message: `The "get-job" command requires 1 parameter: <job-name>`,
                            });
                            this.flashMessageService.pushFlashMessage(invalidCommandErrorMessage);
                        }
                        else {
                            this.webSocketService.getJob({ name: commandSplit[1] });
                        }
                        break;
                    case "new-job":
                        if (commandSplit.length < 3) {
                            const invalidCommandErrorMessage = new message_api_1.FlashMessage({
                                title: "Invalid Command",
                                message: `The "new-job" command requires 2 parameters: <job-name> <template-name>`,
                            });
                            this.flashMessageService.pushFlashMessage(invalidCommandErrorMessage);
                        }
                        else {
                            this.webSocketService.newJob({
                                name: commandSplit[1],
                                type: commandSplit[2],
                                templateName: commandSplit[3],
                            });
                        }
                        break;
                    default:
                        const invalidCommandErrorMessage = new message_api_1.FlashMessage({
                            title: "Invalid Command",
                            message: `"${commandSplit[0]}" is not a valid command type`,
                        });
                        this.flashMessageService.pushFlashMessage(invalidCommandErrorMessage);
                        break;
                }
                commandTb.value = "";
                return false;
            }
        };
    }
    downloadUrl(url) {
        return __awaiter(this, void 0, void 0, function* () {
            this.spinnerService.setSpinner(`download-file-${url}`, {
                name: `Downloading ${url}`,
                icon: spinner_service_service_1.SpinnerIcon.LineSpin,
                progress: 0,
            });
            yield this.restApiService.downloadUrl(url, "text/plain", progress => {
                this.spinnerService.setSpinner(`download-file-${url}`, {
                    name: `Downloading ${url}`,
                    icon: spinner_service_service_1.SpinnerIcon.LineSpin,
                    progress,
                });
            });
            this.spinnerService.removeSpinner(`download-file-${url}`);
        });
    }
    // TODO: this is used by download logs button -> instead use this.jobservice.resolveDirTree so it can handle jobs hosted on cloud
    getMasterJobFilesUrl() {
        return `${this.configService.config.MASTER_WEBSERVER_URL}${this.configService.serverConfig.API_JOB_FILES_URL}`;
    }
};
__decorate([
    core_1.HostListener("document:keyup", ["$event"]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [KeyboardEvent]),
    __metadata("design:returntype", void 0)
], GeowebComponent.prototype, "handleKeyboardEvent", null);
__decorate([
    core_1.ViewChild("mainMenu"),
    __metadata("design:type", primeng_1.SlideMenu)
], GeowebComponent.prototype, "mainMenu", void 0);
__decorate([
    core_1.ViewChild("newJobDialog"),
    __metadata("design:type", primeng_1.Dialog)
], GeowebComponent.prototype, "newJobDialog", void 0);
__decorate([
    core_1.ViewChild("newJobNameInput"),
    __metadata("design:type", Object)
], GeowebComponent.prototype, "newJobNameInput", void 0);
__decorate([
    core_1.ViewChild("getJobDialog"),
    __metadata("design:type", primeng_1.Dialog)
], GeowebComponent.prototype, "getJobDialog", void 0);
__decorate([
    core_1.ViewChild(map_component_1.GeowebMapComponent),
    __metadata("design:type", Object)
], GeowebComponent.prototype, "geoweb", void 0);
GeowebComponent = __decorate([
    core_1.Component({
        selector: "app-geoweb",
        template: __webpack_require__(/*! ./geoweb.component.html */ "./src/app/geo-web/geoweb.component.html"),
        encapsulation: core_1.ViewEncapsulation.None,
        styles: [__webpack_require__(/*! ./geoweb.component.scss */ "./src/app/geo-web/geoweb.component.scss")]
    }),
    __metadata("design:paramtypes", [disclaimer_service_1.DisclaimerSerivce,
        router_1.Router,
        web_socket_service_1.WebSocketService,
        job_service_service_1.JobService,
        flash_message_service_1.FlashMessageService,
        spinner_service_service_1.SpinnerService,
        auth_service_1.AuthService,
        config_service_1.ConfigService,
        rest_api_service_1.RestApiService])
], GeowebComponent);
exports.GeowebComponent = GeowebComponent;


/***/ }),

/***/ "./src/app/geo-web/map/colour-scheme/colour-scheme.ts":
/*!************************************************************!*\
  !*** ./src/app/geo-web/map/colour-scheme/colour-scheme.ts ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const plotty_1 = __webpack_require__(/*! plotty */ "./node_modules/plotty/src/plotty.js");
const d3_1 = __webpack_require__(/*! d3 */ "./node_modules/d3/index.js");
const d3ColorScheme = __webpack_require__(/*! d3-scale-chromatic */ "./node_modules/d3-scale-chromatic/src/index.js");
class ColourScheme {
    constructor(name) {
        this._reversed = false;
        this._name = name;
    }
    get scale() {
        return this._scale;
    }
    get reversed() {
        return this._reversed;
    }
    set reversed(r) {
        this._reversed = r;
    }
    get type() {
        return this._type;
    }
    get name() {
        return this._name;
    }
    setDomain(min, max) { }
    static normalise(min, max) {
        return val => {
            const a = 1 / (max - min);
            return a * val + -(a * min);
        };
    }
    toD3(features) {
        return undefined;
    }
    toPlotty() {
        return undefined;
    }
}
exports.ColourScheme = ColourScheme;
class D3ColourScheme extends ColourScheme {
    constructor(predefinedName = "interpolatePlasma", name = "D3 Colour Scheme") {
        super(name);
        // d3.interpolate
        this.predefinedSchemes = [
            "interpolateBlues",
            "interpolateBrBG",
            "interpolateBuGn",
            "interpolateBuPu",
            "interpolateCool",
            "interpolateCubehelixDefault",
            "interpolateGnBu",
            "interpolateGreens",
            "interpolateGreys",
            "interpolateInferno",
            "interpolateMagma",
            "interpolateOrRd",
            "interpolateOranges",
            "interpolatePRGn",
            "interpolatePiYG",
            "interpolatePlasma",
            "interpolatePuBu",
            "interpolatePuBuGn",
            "interpolatePuOr",
            "interpolatePuRd",
            "interpolatePurples",
            "interpolateRainbow",
            "interpolateRdBu",
            "interpolateRdGy",
            "interpolateRdPu",
            "interpolateRdYlBu",
            "interpolateRdYlGn",
            "interpolateReds",
            "interpolateSinebow",
            "interpolateSpectral",
            "interpolateTurbo",
            "interpolateViridis",
            "interpolateWarm",
            "interpolateYlGn",
            "interpolateYlGnBu",
            "interpolateYlOrBr",
            "interpolateYlOrRd",
        ].map(key => ({
            name: key,
        }));
        this._type = "D3ColourScheme";
        this.predefinedScheme = { name: predefinedName };
    }
    static isInstanceOf(obj) {
        return obj.type === "D3ColourScheme";
    }
    setDomain(min, max) {
        if (!this.reversed) {
            this._scale = d3_1.scaleSequential(d3ColorScheme[this.predefinedScheme.name]).domain([min, max]);
        }
        else {
            this._scale = d3_1.scaleSequential(d3ColorScheme[this.predefinedScheme.name]).domain([max, min]);
        }
        this._colourLegend = undefined;
    }
    // Note:  setDomain must be called before toD3
    toD3() {
        if (typeof this._scale === "undefined") {
            throw "setDomain() must be called before toD3()";
        }
        return d => this._scale(d.properties.value);
    }
    toMapbox(property) {
        if (typeof this._scale === "undefined") {
            throw "setDomain() must be called before toMapbox()";
        }
        const scheme = [
            "interpolate",
            ["linear"],
            ["get", property],
        ];
        const min = this._scale.domain()[0];
        const max = this._scale.domain()[1];
        for (let i = 0; i <= 20; i++) {
            if (this.reversed) {
                // Push value
                scheme.push(max + (min - max) * (i / 20));
                // Push colour
                scheme.push(d3ColorScheme[this.predefinedScheme.name](1 - i / 20));
            }
            else {
                // Push value
                scheme.push(min + (max - min) * (i / 20));
                // Push colour
                scheme.push(d3ColorScheme[this.predefinedScheme.name](i / 20));
            }
        }
        return scheme;
    }
    // Note:  set Domain is NOT required for toPlotty
    toPlotty() {
        const cols = [];
        const pos = [];
        for (let i = 0; i <= 20; i++) {
            pos.push(i / 20);
            cols.push(d3ColorScheme[this.predefinedScheme.name](i / 20));
        }
        if (this.reversed) {
            cols.reverse();
        }
        plotty_1.addColorScale(this.predefinedScheme.name, cols, pos);
        return this.predefinedScheme.name;
    }
}
exports.D3ColourScheme = D3ColourScheme;
class SolidColourScheme extends ColourScheme {
    static isInstanceOf(obj) {
        return obj.type === "SolidColourScheme";
    }
    constructor(solidColour, name = "Solid colour") {
        super(name);
        this._type = "SolidColourScheme";
        this.solidColour = solidColour;
    }
    toD3(features) {
        return (d) => this.solidColour;
    }
}
exports.SolidColourScheme = SolidColourScheme;


/***/ }),

/***/ "./src/app/geo-web/map/map-layer/canvas-layer.ts":
/*!*******************************************************!*\
  !*** ./src/app/geo-web/map/map-layer/canvas-layer.ts ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mapbox_gl_layer_1 = __webpack_require__(/*! ./mapbox-gl-layer */ "./src/app/geo-web/map/map-layer/mapbox-gl-layer.ts");
const map_layer_1 = __webpack_require__(/*! ./map-layer */ "./src/app/geo-web/map/map-layer/map-layer.ts");
const d3_1 = __webpack_require__(/*! d3 */ "./node_modules/d3/index.js");
class CanvasOverlayLayer extends mapbox_gl_layer_1.MapboxGlLayer {
    constructor(name) {
        super(name);
        this._rendered = false;
        this._rendering = false;
        this._rootElement = d3_1.select("body").append("canvas");
        this._mapboxId = `${this.type}-${name}`.replace(" ", "-").toLowerCase();
        this._rootElement.attr("id", this._mapboxId);
        this._rootElement.style("display", "none");
        this._canvasContext = this._rootElement.node().getContext("2d");
        // this._canvasContext.globalCompositeOperation = "lighten"
        this._canvasContext.imageSmoothingEnabled = false;
    }
    static isInstanceOf(obj) {
        return "rootElement" in obj && "render" in obj;
    }
    get rootElement() {
        return this._rootElement;
    }
    render(force = false) {
        const _super = Object.create(null, {
            render: { get: () => super.render }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const bbox = this.getBbox();
            if (typeof bbox === "undefined") {
                return;
            }
            if (typeof this._mapboxGlLayer === "undefined" ||
                typeof this._source === "undefined") {
                this._mapboxGlLayer = {
                    id: this._mapboxId,
                    type: "raster",
                    source: this._mapboxId,
                    paint: {
                        "raster-fade-duration": 0,
                        "raster-resampling": "nearest",
                    },
                };
                this._source = {
                    id: this._mapboxId,
                    source: {
                        type: "canvas",
                        canvas: this._mapboxId,
                        coordinates: [
                            [bbox[0], bbox[3]],
                            [bbox[2], bbox[3]],
                            [bbox[2], bbox[1]],
                            [bbox[0], bbox[1]],
                        ],
                    },
                };
            }
            else if (this._source.source.coordinates[0][0] !== bbox[0] ||
                this._source.source.coordinates[0][1] !== bbox[3] ||
                this._source.source.coordinates[1][0] !== bbox[2] ||
                this._source.source.coordinates[3][1] !== bbox[1]) {
                this._source.source.coordinates = [
                    [bbox[0], bbox[3]],
                    [bbox[2], bbox[3]],
                    [bbox[2], bbox[1]],
                    [bbox[0], bbox[1]],
                ];
                map_layer_1.MapLayer.layerService.mapboxGl.getSource(this._mapboxId).setCoordinates(this._source.source.coordinates);
                console.log("set coords");
            }
            yield _super.render.call(this, force);
        });
    }
    clear() {
        const _super = Object.create(null, {
            clear: { get: () => super.clear }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._rendering) {
                _super.clear.call(this);
                this._rendered = false;
            }
            // TODO: if rendering -> clear after render
        });
    }
    delete() {
        const _super = Object.create(null, {
            delete: { get: () => super.delete }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.delete.call(this);
            if (typeof this._rootElement !== "undefined" &&
                typeof this._rootElement.remove === "function") {
                this._rootElement.remove();
            }
            // TODO: if rendering -> delete after render
        });
    }
}
exports.CanvasOverlayLayer = CanvasOverlayLayer;


/***/ }),

/***/ "./src/app/geo-web/map/map-layer/layer-service.service.ts":
/*!****************************************************************!*\
  !*** ./src/app/geo-web/map/map-layer/layer-service.service.ts ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const rest_api_service_1 = __webpack_require__(/*! src/app/services/rest-api.service */ "./src/app/services/rest-api.service.ts");
const spinner_service_service_1 = __webpack_require__(/*! src/app/spinner/spinner-service.service */ "./src/app/spinner/spinner-service.service.ts");
const flash_message_service_1 = __webpack_require__(/*! src/app/services/flash-message.service */ "./src/app/services/flash-message.service.ts");
const map_layer_1 = __webpack_require__(/*! ./map-layer */ "./src/app/geo-web/map/map-layer/map-layer.ts");
const map_geotiff_layer_1 = __webpack_require__(/*! ./map-geotiff-layer */ "./src/app/geo-web/map/map-layer/map-geotiff-layer.ts");
const message_api_1 = __webpack_require__(/*! ../../../../../../shared/src/message-api */ "../shared/src/message-api/index.ts");
const array_1 = __webpack_require__(/*! ../../../../../../shared/src/util/array */ "../shared/src/util/array.ts");
const parseGeoraster = __webpack_require__(/*! georaster */ "./node_modules/georaster/dist/georaster.browser.bundle.min.js");
const rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm2015/index.js");
const map_popup_service_1 = __webpack_require__(/*! ../map-popup/map-popup.service */ "./src/app/geo-web/map/map-popup/map-popup.service.ts");
const geospatial_projections_1 = __webpack_require__(/*! ../../../../../../shared/src/util/geospatial-projections */ "../shared/src/util/geospatial-projections.ts");
const config_service_1 = __webpack_require__(/*! src/app/services/config.service */ "./src/app/services/config.service.ts");
const proj4x = __webpack_require__(/*! proj4 */ "./node_modules/proj4/lib/index.js");
const proj4 = proj4x.default;
proj4.defs(geospatial_projections_1.proj4defs);
let LayerService = class LayerService {
    constructor(restApiService, spinnerService, flashMessageService, configService, mapPopupService, zone) {
        this.restApiService = restApiService;
        this.spinnerService = spinnerService;
        this.flashMessageService = flashMessageService;
        this.configService = configService;
        this.mapPopupService = mapPopupService;
        this.zone = zone;
        this.fileCacheMaxNum = 100;
        this.geotiffCacheMaxNum = 200;
        this.chartBehaviourSubject = new rxjs_1.BehaviorSubject(undefined);
        this._chartBehaviourObservable = this.chartBehaviourSubject.asObservable();
        this.urlFileMap = {};
        this.geotiffLayerMap = {};
        map_layer_1.MapLayer.setLayerService(this);
    }
    get chartBehaviourObservable() {
        return this._chartBehaviourObservable;
    }
    ngOnDestroy() { }
    getGeotiffData(url, name = url, projectionOverride) {
        const layerKey = `${url}`;
        // If file has not been downloaded before
        if (typeof this.geotiffLayerMap[layerKey] === "undefined") {
            if (Object.keys(this.geotiffLayerMap).length > this.geotiffCacheMaxNum) {
                delete this.geotiffLayerMap[Object.keys(this.geotiffLayerMap)[0]];
            }
            this.geotiffLayerMap[layerKey] = { promises: new Set() };
            // Create promise to return
            const getFilePromise = new Promise((resolve, reject) => {
                this.geotiffLayerMap[layerKey].promises.add({ resolve, reject });
            });
            (() => __awaiter(this, void 0, void 0, function* () {
                try {
                    this.spinnerService.setSpinner(`current-job-geotiff-${layerKey}`, {
                        name: `Rendering ${name} layer`,
                        icon: spinner_service_service_1.SpinnerIcon.GridPulse,
                    });
                    const arrayBuffer = yield this.getFile(url, rest_api_service_1.ResponseType.ArrayBuffer);
                    const result = yield parseGeoraster(arrayBuffer);
                    if (result.noDataValue === null) {
                        result.noDataValue = NaN;
                    }
                    // const result: RasterLayerData = await this.geotiffLoader.run({
                    //   arrayBuffer,
                    //   samples: Array.isArray(band) ? band : [band],
                    //   key: layerKey,
                    // })
                    result.valuesFlat = result.values.map(values => array_1.concatenate(Float32Array, ...values));
                    result.geotiffArrayBuffer = arrayBuffer;
                    let projection = result.projection;
                    if (typeof projectionOverride !== "undefined") {
                        projection = projectionOverride;
                    }
                    if (projection === 4326) {
                        result.bbox4326 = [
                            result.xmin,
                            result.ymin,
                            result.xmax,
                            result.ymax,
                        ];
                    }
                    else {
                        result.bbox4326 = [
                            ...proj4(`EPSG:${projection}`, "EPSG:4326").forward([
                                result.xmin,
                                result.ymin,
                            ]),
                            ...proj4(`EPSG:${projection}`, "EPSG:4326").forward([
                                result.xmax,
                                result.ymax,
                            ]),
                        ];
                    }
                    this.geotiffLayerMap[layerKey].data = result;
                    this.geotiffLayerMap[layerKey].promises.forEach(promiseObj => {
                        promiseObj.resolve(result);
                    });
                    this.geotiffLayerMap[layerKey].promises.clear();
                }
                catch (error) {
                    this.flashMessageService.pushFlashMessage(new message_api_1.FlashMessage({
                        message: error,
                        title: `Failed to render ${name} layer`,
                        sticky: true,
                    }));
                    this.geotiffLayerMap[layerKey].promises.forEach(promiseObj => promiseObj.reject(error));
                    this.geotiffLayerMap[layerKey].promises.clear();
                    throw error;
                }
                finally {
                    this.spinnerService.removeSpinner(`current-job-geotiff-${layerKey}`);
                }
            }))();
            return getFilePromise;
        }
        // If file is downloading -> add promise
        if (typeof this.geotiffLayerMap[layerKey].data === "undefined") {
            return new Promise((resolve, reject) => {
                this.geotiffLayerMap[layerKey].promises.add({ reject, resolve });
            });
        }
        // If file data already downloaded -> return data
        return Promise.resolve(this.geotiffLayerMap[layerKey].data);
    }
    geotiffLayerFactory(geotiffSpecs) {
        return __awaiter(this, void 0, void 0, function* () {
            return array_1.flattenArray(yield Promise.all(geotiffSpecs.map((geotiffSpec) => __awaiter(this, void 0, void 0, function* () {
                const downloadData = {
                    action: geotiffSpec.geotiffPath,
                    description: `GeoTIFF with all raster layers`,
                    metadata: ``,
                    disabled: false,
                };
                // Generate geotiff metadata JSON
                downloadData.metadata = JSON.stringify(Object.keys(geotiffSpec.layerSpecs).reduce((accum, current) => {
                    accum[current] = {
                        name: geotiffSpec.layerSpecs[current].name,
                        units: geotiffSpec.layerSpecs[current].units,
                    };
                    return accum;
                }, {}), null, 2);
                return Object.keys(geotiffSpec.layerSpecs).map(key => {
                    const layerSpec = geotiffSpec.layerSpecs[key];
                    layerSpec.downloadData = downloadData;
                    const layer = new map_geotiff_layer_1.RasterLayer(layerSpec.name, geotiffSpec.geotiffPath, parseInt(key, 10));
                    // Assign all other properties to the created Layer
                    Object.assign(layer, layerSpec);
                    return layer;
                });
            }))));
        });
    }
    getFile(url, responseType, urlKey = url, persistentOnClear = false) {
        // If file has not been downloaded before
        if (!(urlKey in this.urlFileMap)) {
            // Only keep 20 files
            if (Object.keys(this.urlFileMap).length > this.fileCacheMaxNum) {
                console.log(`delete ${Object.keys(this.urlFileMap)[0]}`);
                delete this.urlFileMap[Object.keys(this.urlFileMap)[0]];
            }
            this.urlFileMap[urlKey] = {
                promises: new Set(),
                responseType,
                persistentOnClear,
            };
            // Create promise to return
            const getFilePromise = new Promise((resolve, reject) => {
                this.urlFileMap[urlKey].promises.add({ resolve, reject });
            });
            // Download file
            this.restApiService
                .get(url, responseType, progress => {
                this.spinnerService.setSpinner(`geturl-${urlKey}`, {
                    name: `Downloading ${url}`,
                    icon: spinner_service_service_1.SpinnerIcon.GridPulse,
                    progress,
                });
            })
                // Download success
                .then(response => {
                this.urlFileMap[urlKey].data = response;
                this.urlFileMap[urlKey].promises.forEach(promiseObj => promiseObj.resolve(response));
                this.urlFileMap[urlKey].promises.clear();
            })
                // Download error
                .catch(error => {
                const invalidCommandErrorMessage = new message_api_1.FlashMessage({
                    title: `Failed to fetch URL ${url}`,
                    message: "message" in error ? error.message : error,
                    sticky: true,
                });
                this.flashMessageService.pushFlashMessage(invalidCommandErrorMessage);
                this.urlFileMap[urlKey].promises.forEach(promiseObj => promiseObj.reject(error));
                this.urlFileMap[urlKey].promises.clear();
            })
                .finally(() => {
                this.spinnerService.removeSpinner(`geturl-${urlKey}`);
            });
            return getFilePromise;
        }
        // If file is downloading -> add promise
        if (typeof this.urlFileMap[urlKey].data === "undefined") {
            return new Promise((resolve, reject) => {
                this.urlFileMap[urlKey].promises.add({ reject, resolve });
            });
        }
        // If file data already downloaded -> return data
        return Promise.resolve(this.urlFileMap[urlKey].data);
    }
    clearFileCache() {
        this.urlFileMap = Object.keys(this.urlFileMap).reduce((files, currentKey) => {
            if (this.urlFileMap[currentKey].persistentOnClear) {
                files[currentKey] = this.urlFileMap[currentKey];
                console.log(`keep ${currentKey}`);
            }
            return files;
        }, {});
        this.geotiffLayerMap = {};
    }
    createNewChart(obj) {
        this.currentChart = obj.chart;
        this.zone.run(() => this.chartBehaviourSubject.next(obj));
    }
    removeChart() {
        if (typeof this.currentChart !== "undefined") {
            try {
                this.currentChart.destroy();
            }
            catch (_a) { }
        }
        this.chartBehaviourSubject.next(undefined);
    }
    showPopup(message) {
        this.zone.run(() => {
            this.mapPopupService.showPopup(message);
        });
    }
};
LayerService.proj4 = proj4;
LayerService = __decorate([
    core_1.Injectable({
        providedIn: "root",
    }),
    __metadata("design:paramtypes", [rest_api_service_1.RestApiService,
        spinner_service_service_1.SpinnerService,
        flash_message_service_1.FlashMessageService,
        config_service_1.ConfigService,
        map_popup_service_1.PopupFormService,
        core_1.NgZone])
], LayerService);
exports.LayerService = LayerService;


/***/ }),

/***/ "./src/app/geo-web/map/map-layer/map-editable-feature-layer.ts":
/*!*********************************************************************!*\
  !*** ./src/app/geo-web/map/map-layer/map-editable-feature-layer.ts ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const turf_1 = __webpack_require__(/*! @turf/turf */ "./node_modules/@turf/turf/turf.min.js");
const map_layer_1 = __webpack_require__(/*! ./map-layer */ "./src/app/geo-web/map/map-layer/map-layer.ts");
const colour_scheme_1 = __webpack_require__(/*! ../colour-scheme/colour-scheme */ "./src/app/geo-web/map/colour-scheme/colour-scheme.ts");
const download_file_1 = __webpack_require__(/*! src/app/util/download-file */ "./src/app/util/download-file.ts");
const rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm2015/index.js");
const mapbox_gl_layer_1 = __webpack_require__(/*! ./mapbox-gl-layer */ "./src/app/geo-web/map/map-layer/mapbox-gl-layer.ts");
const mergeOptions = __webpack_require__(/*! merge-options */ "./node_modules/merge-options/index.js");
var FeatureType;
(function (FeatureType) {
    FeatureType["Point"] = "point";
    FeatureType["Polygon"] = "polygon";
    FeatureType["Line"] = "line";
})(FeatureType = exports.FeatureType || (exports.FeatureType = {}));
class EditableFeatureToolbarButton {
}
exports.EditableFeatureToolbarButton = EditableFeatureToolbarButton;
class EditableFeatureCollectionLayer extends map_layer_1.MapLayer {
    constructor(jobName, name, fc = turf_1.featureCollection([]), colourScheme = new colour_scheme_1.SolidColourScheme("#000000")) {
        super(name);
        this._mapboxLayers = [];
        this.singleFeature = false;
        this.defaultFeatureProperties = { point: {}, line: {}, polygon: {} };
        // Form Models for editing feature properties (separate form for Point, Line and Polygon)
        this.featurePropertiesFormModel = {};
        this.toolbarButtonOptions = {};
        this._featureCollection = turf_1.featureCollection([]);
        this._editFeatureCollection = turf_1.featureCollection([]);
        this._featureCollectionBehaviourSubject = new rxjs_1.BehaviorSubject(this._featureCollection);
        this.onClick = (p) => {
            const mouseTreshold = 20;
            const mousePoint = turf_1.point([p.latlng.lng, p.latlng.lat]);
            const foundFeature = this._featureCollection.features.reduce((closestFeature, current, currentIndex) => {
                const withinMouseThreshold = map_layer_1.MapLayer.layerService.mapboxGl
                    .project(turf_1.centroid(current).geometry.coordinates)
                    .dist(p.layerPoint) < mouseTreshold;
                const distanceToCurrentFeature = turf_1.distance(turf_1.centroid(current), mousePoint);
                const distanceToClosestFeature = typeof closestFeature.feature === "undefined"
                    ? 1000
                    : turf_1.distance(turf_1.centroid(closestFeature.feature), mousePoint);
                // If current feature is closer to mouse than the closest feature
                if (distanceToCurrentFeature < distanceToClosestFeature) {
                    if (
                    // If Point and mouse point is within distance threshold
                    (current.geometry.type === "Point" && withinMouseThreshold) ||
                        // If Line and mouse point is within distance threshold
                        ((current.geometry.type === "LineString" ||
                            current.geometry.type === "MultiLineString") &&
                            turf_1.pointToLineDistance(mousePoint, current) < mouseTreshold &&
                            withinMouseThreshold) ||
                        // If Polygon and the point is within polygon
                        ((current.geometry.type === "Polygon" ||
                            current.geometry.type === "MultiPolygon") &&
                            turf_1.booleanWithin(mousePoint, current))) {
                        return { feature: current, index: currentIndex };
                    }
                }
                return closestFeature;
            }, { feature: undefined, index: undefined });
            if (typeof foundFeature.feature === "undefined") {
                return;
            }
            if (EditableFeatureCollectionLayer.mode === "create") {
                this.editFeatureProperties(foundFeature.feature, foundFeature.index);
            }
            else {
                this.editFeatureGeometry(foundFeature.feature, foundFeature.index);
            }
        };
        this._mapboxId = `fclayer-${jobName}-${name}`
            .replace(" ", "-")
            .toLowerCase();
        this._type = "EditableFeatureCollectionLayer";
        this._opacity = 0.8;
        this.onClickPolicy = "all";
        this.blendModes = [];
        this._featureCollection = fc;
        this.updateFeatureCollection();
        this._colourScheme = colourScheme;
        this.downloadData = {
            action: (() => {
                download_file_1.downloadFile(`${this.name}.json`, JSON.stringify(this._featureCollection), "text/json");
            }).bind(this),
            description: `GeoJSON of ${this.name} features`,
            metadata: "",
            disabled: false,
        };
        const fillLayer = new mapbox_gl_layer_1.MapboxGlLayer(`${this._mapboxId}-fill`, {
            id: `${this._mapboxId}-fill`,
            type: "fill",
            source: this._mapboxId,
        });
        fillLayer.mapboxFilter = ["==", "$type", "Polygon"];
        fillLayer.colourScheme = this.colourScheme;
        const lineLayer = new mapbox_gl_layer_1.MapboxGlLayer(`${this._mapboxId}-line`, {
            id: `${this._mapboxId}-line`,
            type: "line",
            source: this._mapboxId,
            paint: { "line-width": 3 },
        });
        lineLayer.mapboxFilter = ["==", "$type", "LineString"];
        lineLayer.colourScheme = this.colourScheme;
        const pointLayer = new mapbox_gl_layer_1.MapboxGlLayer(`${this._mapboxId}-point`, {
            id: `${this._mapboxId}-point`,
            type: "circle",
            source: this._mapboxId,
            paint: {
                "circle-radius": 10,
            },
        });
        pointLayer.mapboxFilter = ["==", "$type", "Point"];
        pointLayer.colourScheme = this.colourScheme;
        this._mapboxLayers = [fillLayer, pointLayer, lineLayer];
        this.linkedLayers = this._mapboxLayers;
    }
    get featureCollection() {
        return this._featureCollection;
    }
    set featureCollection(fc) {
        this._featureCollection = fc;
        this.updateFeatureCollection();
    }
    get featureCollectionObservable() {
        return this._featureCollectionBehaviourSubject.asObservable();
    }
    get mapboxLayers() {
        return this._mapboxLayers;
    }
    updateLayer(updateLinked = true) {
        const _super = Object.create(null, {
            updateLayer: { get: () => super.updateLayer }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.updateLayer.call(this, updateLinked);
        });
    }
    static isInstanceOf(obj) {
        return obj.type === "EditableFeatureCollectionLayer";
    }
    static enableEditMode() {
        if (!EditableFeatureCollectionLayer.editInProgress) {
            EditableFeatureCollectionLayer.mode = "edit";
            EditableFeatureCollectionLayer.editInProgress = true;
        }
    }
    static disableEditMode(layers, keepChanges = true) {
        if (EditableFeatureCollectionLayer.editInProgress &&
            EditableFeatureCollectionLayer.mode === "edit") {
            if (keepChanges) {
                layers.forEach(l => {
                    l.addFeatures(l._editFeatureCollection.features.map(feature => {
                        // Only update geometery from mapboxDraw features
                        const newFeature = EditableFeatureCollectionLayer.layerService.mapboxDraw.get(feature.properties.mapboxDrawId);
                        feature.geometry = newFeature.geometry;
                        return feature;
                    }));
                    l._editFeatureCollection.features = [];
                });
            }
            else {
                layers.forEach(l => {
                    l.addFeatures(l._editFeatureCollection.features);
                    l._editFeatureCollection.features = [];
                });
            }
            map_layer_1.MapLayer.layerService.mapboxDraw.deleteAll();
            map_layer_1.MapLayer.layerService.mapboxDraw.trash();
            EditableFeatureCollectionLayer.mode = "create";
            EditableFeatureCollectionLayer.editInProgress = false;
        }
    }
    get colourScheme() {
        return this._colourScheme;
    }
    set colourScheme(c) {
        this._colourScheme = c;
        this._mapboxLayers.forEach(l => {
            l.colourScheme = c;
        });
    }
    show() {
        const _super = Object.create(null, {
            show: { get: () => super.show }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this._mapboxLayers.map(layer => layer.show()));
            yield _super.show.call(this);
        });
    }
    hide() {
        const _super = Object.create(null, {
            hide: { get: () => super.hide }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this._mapboxLayers.map(layer => layer.hide()));
            yield _super.hide.call(this);
        });
    }
    clear() {
        const _super = Object.create(null, {
            clear: { get: () => super.clear }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this._mapboxLayers.map((layer) => __awaiter(this, void 0, void 0, function* () { return yield layer.clear(); })));
            if (typeof map_layer_1.MapLayer.layerService.mapboxGl.getSource(this._mapboxId) !==
                "undefined") {
                map_layer_1.MapLayer.layerService.mapboxGl.removeSource(this._mapboxId);
                console.log(`removing source ${this._mapboxId}`);
            }
            yield _super.clear.call(this);
        });
    }
    set opacity(o) {
        super.opacity = o;
        this._mapboxLayers.map(layer => (layer.opacity = o));
    }
    get opacity() {
        return super.opacity;
    }
    resolveFeatureProperties(featureProps) {
        const resolved = {};
        // If any of the properties are functions -> call the function
        Object.keys(featureProps).forEach(key => {
            if (typeof featureProps[key] === "function") {
                resolved[key] = featureProps[key]();
            }
            else {
                resolved[key] = featureProps[key];
            }
        });
        return resolved;
    }
    createNewFeature(type) {
        if (EditableFeatureCollectionLayer.editInProgress) {
            return;
        }
        EditableFeatureCollectionLayer.editInProgress = true;
        switch (type) {
            case FeatureType.Point:
                map_layer_1.MapLayer.layerService.mapboxDraw.changeMode("draw_point");
                this.setOnCreateHandler(this.defaultFeatureProperties.point);
                break;
            case FeatureType.Line:
                map_layer_1.MapLayer.layerService.mapboxDraw.changeMode("draw_line_string");
                this.setOnCreateHandler(this.defaultFeatureProperties.line);
                break;
            case FeatureType.Polygon:
                map_layer_1.MapLayer.layerService.mapboxDraw.changeMode("draw_polygon");
                this.setOnCreateHandler(this.defaultFeatureProperties.polygon);
                break;
        }
    }
    setOnCreateHandler(defaultFeatureProperties) {
        const _self = this;
        const removeHandlers = event => {
            // Remove draw created event handler
            map_layer_1.MapLayer.layerService.mapboxGl.off("draw.modechange", removeHandlers);
            map_layer_1.MapLayer.layerService.mapboxGl.off("draw.create", onCreateHandler);
            map_layer_1.MapLayer.layerService.mapboxDraw.trash();
            EditableFeatureCollectionLayer.editInProgress = false;
        };
        const onCreateHandler = (event) => {
            // Remove draw created event handler
            removeHandlers(event);
            _self.addFeatures(event.features, defaultFeatureProperties);
        };
        map_layer_1.MapLayer.layerService.mapboxGl.on("draw.create", onCreateHandler);
        map_layer_1.MapLayer.layerService.mapboxGl.on("draw.modechange", removeHandlers);
    }
    addFeatures(features, deafultFeatureProperties = {}) {
        const _self = this;
        if (this.singleFeature) {
            this._featureCollection.features = [];
            if (features.length > 1) {
                features = [features.shift()];
            }
        }
        features.forEach(feature => {
            const properties = (feature.properties = feature.properties || {}); // Initialize feature.properties if needed
            Object.assign(properties, this.resolveFeatureProperties(deafultFeatureProperties));
        });
        this._featureCollection.features.push(...features);
        this.updateFeatureCollection();
    }
    /**
     * Call this method after updating this._featureCollection
     *
     * @private
     */
    updateFeatureCollection() {
        const source = map_layer_1.MapLayer.layerService.mapboxGl.getSource(this._mapboxId);
        if (typeof source !== "undefined") {
            source.setData(this._featureCollection);
        }
        else {
            map_layer_1.MapLayer.layerService.mapboxGl.addSource(this._mapboxId, {
                type: "geojson",
                data: this._featureCollection,
            });
        }
        this._featureCollectionBehaviourSubject.next(this._featureCollection);
    }
    editFeature(f, index) { }
    /**
     * Returns array of Toolbar buttons
     */
    getToolbarButtons() {
        return Object.keys(this.toolbarButtonOptions).map(featureType => {
            // If createNewFn is not set -> return default createNewFeature function
            if (typeof this.toolbarButtonOptions[featureType].createNewFn !== "function") {
                return Object.assign({}, this.toolbarButtonOptions[featureType], {
                    createNewFn: this.createNewFeature.bind(this, featureType),
                });
            }
            // Otherwise return function set
            return this.toolbarButtonOptions[featureType];
        });
    }
    editFeatureGeometry(feature, index) {
        const [mapboxDrawId] = map_layer_1.MapLayer.layerService.mapboxDraw.add(JSON.parse(JSON.stringify(turf_1.featureCollection([feature]))));
        const oldFeature = this._featureCollection.features.splice(index, 1)[0];
        oldFeature.properties.mapboxDrawId = mapboxDrawId;
        this._editFeatureCollection.features.push(oldFeature);
        this.updateFeatureCollection();
        map_layer_1.MapLayer.layerService.mapboxDraw.changeMode("simple_select", {
            featureIds: [mapboxDrawId],
        });
    }
    editFeatureProperties(feature, index) {
        // Get formschema for layer type
        let formSchema;
        if (feature.geometry.type === "Point") {
            formSchema = this.featurePropertiesFormModel.point;
        }
        else if (feature.geometry.type === "LineString" ||
            feature.geometry.type === "MultiLineString") {
            formSchema = this.featurePropertiesFormModel.line;
        }
        else if (feature.geometry.type === "Polygon" ||
            feature.geometry.type === "MultiPolygon") {
            formSchema = this.featurePropertiesFormModel.polygon;
        }
        if (typeof formSchema !== "undefined") {
            if (EditableFeatureCollectionLayer.editInProgress) {
                return false;
            }
            map_layer_1.MapLayer.layerService.showPopup({
                title: `Edit ${this.name} feature`,
                model: feature,
                dangerBtn: {
                    label: "Delete",
                    onClickFn: (() => {
                        this._featureCollection.features.splice(index, 1);
                        this.updateFeatureCollection();
                    }).bind(this),
                },
                coordinates: map_layer_1.MapLayer.layerService.mapboxGl.project(turf_1.centroid(feature)
                    .geometry.coordinates),
                formSchema,
                formOnSubmitFn: updatedModel => {
                    // If the form has geometry editing -> update coordinates
                    if ("geometry" in updatedModel) {
                        // Change coordinates to array (as NgDynamicForms will change keys to strings)
                        if (!Array.isArray(updatedModel.geometry.coordinates)) {
                            updatedModel.geometry.coordinates = Object.values(updatedModel.geometry.coordinates).map(coords => parseFloat(coords));
                        }
                        // Check that all coordinates are set
                        if (typeof updatedModel.geometry.coordinates.find(coord => coord === "") === "undefined") {
                            if (feature.geometry.type === "Point") {
                                ;
                                feature.geometry.coordinates =
                                    updatedModel.geometry.coordinates;
                            }
                            else {
                                // TODO: add polygon coordinate editing
                            }
                        }
                    }
                    // (deep) Merge layer feature with form Model
                    this._featureCollection.features[index] = mergeOptions(feature, updatedModel);
                    this.updateFeatureCollection();
                },
                closeOnMapMove: true,
                background: true,
            });
        }
    }
}
EditableFeatureCollectionLayer.editInProgress = false;
EditableFeatureCollectionLayer.mode = "create";
exports.EditableFeatureCollectionLayer = EditableFeatureCollectionLayer;


/***/ }),

/***/ "./src/app/geo-web/map/map-layer/map-geotiff-layer.ts":
/*!************************************************************!*\
  !*** ./src/app/geo-web/map/map-layer/map-geotiff-layer.ts ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const plotty_1 = __webpack_require__(/*! plotty */ "./node_modules/plotty/src/plotty.js");
const d3_1 = __webpack_require__(/*! d3 */ "./node_modules/d3/index.js");
const map_layer_1 = __webpack_require__(/*! ./map-layer */ "./src/app/geo-web/map/map-layer/map-layer.ts");
const colour_scheme_1 = __webpack_require__(/*! ../colour-scheme/colour-scheme */ "./src/app/geo-web/map/colour-scheme/colour-scheme.ts");
const web_worker_1 = __webpack_require__(/*! ../../../util/web-workers/web-worker */ "./src/app/util/web-workers/web-worker.ts");
const canvas_layer_1 = __webpack_require__(/*! ./canvas-layer */ "./src/app/geo-web/map/map-layer/canvas-layer.ts");
const geospatial_projections_1 = __webpack_require__(/*! ../../../../../../shared/src/util/geospatial-projections */ "../shared/src/util/geospatial-projections.ts");
class RasterLayer extends canvas_layer_1.CanvasOverlayLayer {
    constructor(name, data, _band = 0) {
        super(name);
        this._band = _band;
        this.valueFormatFn = d3_1.format(".2f");
        this._type = "RasterLayer";
        this.setData(data);
        this.colourScheme = new colour_scheme_1.D3ColourScheme("interpolateInferno");
    }
    setData(data) {
        return __awaiter(this, void 0, void 0, function* () {
            delete this._data;
            if (typeof data === "function") {
                this._getDataFn = data;
            }
            else if (typeof data === "string") {
                this._getDataFn = () => map_layer_1.MapLayer.layerService.getGeotiffData(data, this.name, this.projectionOverride);
            }
            else {
                this._data = data;
            }
            if (this.visible) {
                yield this.render(true);
            }
        });
    }
    get data() {
        return this._data;
    }
    getBbox() {
        if (typeof this.data === "undefined") {
            return undefined;
        }
        return this.data.bbox4326;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this._data === "undefined") {
                try {
                    this._data = yield this._getDataFn();
                    // If minValue/maxValue wasn't set manually -> use min/max pixel values
                    if (typeof this.maxValue === "undefined" ||
                        typeof this.minValue === "undefined") {
                        // Unfortunately - georaster's min/max values are sometimes wrong (that is this._data.mins/maxs
                        let maxValue = d3_1.max(this._data.valuesFlat[this._band]);
                        let minValue = d3_1.min(this._data.valuesFlat[this._band]);
                        // Check if nodatavalue is min or max -> and then set min/max pixel values accordingly
                        if (this.data.noDataValue === minValue) {
                            minValue = d3_1.min(this._data.valuesFlat[this._band], d => d <= this.data.noDataValue ? maxValue : d);
                        }
                        if (this.data.noDataValue === maxValue) {
                            maxValue = d3_1.max(this._data.valuesFlat[this._band], d => d >= this.data.noDataValue ? minValue : d);
                        }
                        if (typeof this.maxValue === "undefined") {
                            this.maxValue = maxValue;
                        }
                        if (typeof this.minValue === "undefined") {
                            this.minValue = minValue;
                        }
                    }
                }
                catch (error) {
                    if (error !== web_worker_1.WebWorkerErrorMessages.WorkerTerminated) {
                        console.log(`Error occurred while initialising layer ${this.name} (${error})`);
                        console.log(error);
                    }
                    throw error;
                }
            }
        });
    }
    render(force = false) {
        const _super = Object.create(null, {
            render: { get: () => super.render }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if ((this._rendered && !force) || this._rendering) {
                return;
            }
            this._rendering = true;
            try {
                yield this.init();
            }
            catch (error) {
                this._rendering = false;
                return;
            }
            const plot = new plotty_1.plot({
                domain: [this.minValue, this.maxValue],
                canvas: this._rootElement.node(),
                data: this._data.valuesFlat[this._band],
                width: this._data.width,
                height: this._data.height,
                colorScale: this.colourScheme.toPlotty(),
            });
            plot.setNoDataValue(this.data.noDataValue);
            plot.setClamp(false, true);
            plot.render();
            yield _super.render.call(this, force);
            this._rendering = false;
            this._rendered = true;
        });
    }
    clear() {
        super.clear();
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this._rendered) {
                yield this.hide();
                setTimeout(() => {
                    this._canvasContext.clearRect(0, 0, this._data.width, this._data.height);
                    // this._data.pixels = [] ?????
                    // how to clear georaster
                    this._initialised = false;
                    resolve();
                }, 500);
            }
            else {
                resolve();
            }
        }));
    }
    hide() {
        super.hide();
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this._rendered) {
                this._rootElement
                    .transition()
                    .duration(400)
                    .style("opacity", 0)
                    .on("end", () => {
                    resolve();
                });
            }
        }));
    }
    show() {
        const _super = Object.create(null, {
            show: { get: () => super.show }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._rendered) {
                yield this.render();
            }
            yield _super.show.call(this);
        });
    }
    getValueAtPoint(point) {
        if (typeof this._data !== "undefined") {
            // Adapted from https://github.com/stuartmatthews/leaflet-geotiff/blob/master/leaflet-geotiff.js
            const EPSG3857coords = geospatial_projections_1.projectCoords([point.latlng.lng, point.latlng.lat], geospatial_projections_1.EPSG4326, geospatial_projections_1.EPSG3857);
            const x = Math.floor((EPSG3857coords[0] - this.data.xmin) / this.data.pixelWidth);
            const y = Math.floor((this.data.ymax - EPSG3857coords[1]) / this.data.pixelHeight);
            // If x and y are outside range return undefined
            if (x < 0 || x > this._data.width || y < 0 || y > this._data.height) {
                return undefined;
            }
            // const i = y * this._data.width + x
            const value = this._data.values[this._band][y][x];
            if (value !== this.data.noDataValue) {
                return this.valueFormatFn(value);
            }
        }
        return undefined;
    }
}
exports.RasterLayer = RasterLayer;
class RasterMultiLayer extends RasterLayer {
    constructor(name, _dimensions, _layerMap) {
        super(name, _layerMap(_dimensions));
        this._dimensions = _dimensions;
        this._layerMap = _layerMap;
        this._type = "RasterMultiLayer";
        this.disableFilter = true;
    }
    static isInstanceOf(obj) {
        return obj.type === "RasterMultiLayer";
    }
    get layerMap() {
        return this._layerMap;
    }
    get dimensions() {
        return this._dimensions;
    }
    get dimensionsArray() {
        return Object.values(this._dimensions);
    }
    updateLayer(updateLinked = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const newData = this._layerMap(this._dimensions);
            yield this.setData(newData);
            if (updateLinked) {
                yield Promise.all(this.linkedLayers.map(layer => layer.updateLayer(false)));
            }
        });
    }
}
exports.RasterMultiLayer = RasterMultiLayer;
const gpu_js_1 = __webpack_require__(/*! gpu.js */ "./node_modules/gpu.js/dist/gpu-browser.js");
const array_1 = __webpack_require__(/*! ../../../../../../shared/src/util/array */ "../shared/src/util/array.ts");
class RasterExpressionLayer extends RasterLayer {
    constructor(name, _layers, _kernalFn) {
        super(name);
        this._layers = _layers;
        this._kernalFn = _kernalFn;
        this._layerUpdating = false;
        this.setData(this.calc);
        this._type = "RasterExpressionLayer";
        if (RasterMultiLayer.isInstanceOf(_layers[0])) {
            this.disableFilter = true;
        }
    }
    calc() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this._layers.map(layer => layer.init()));
            const gpu = new gpu_js_1.GPU();
            const kernal = gpu
                .createKernel(this._kernalFn)
                .setOutput([this._layers[0].data.width, this._layers[0].data.height]);
            const results = kernal(this._layers.map(layer => layer.data.values[0]));
            gpu.destroy();
            const newRasterLayerData = Object.assign({}, this._layers[0].data);
            newRasterLayerData.geotiffArrayBuffer = undefined;
            newRasterLayerData.values = [results];
            newRasterLayerData.valuesFlat = newRasterLayerData.values.map(values => array_1.concatenate(Float32Array, ...values));
            return newRasterLayerData;
        });
    }
    get dimensions() {
        if (RasterMultiLayer.isInstanceOf(this._layers[0])) {
            return this._layers[0].dimensions;
        }
        return undefined;
    }
    get dimensionsArray() {
        if (RasterMultiLayer.isInstanceOf(this._layers[0])) {
            return Object.values(this._layers[0].dimensions);
        }
        return undefined;
    }
    updateLayer(updateLinked = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._layerUpdating || this._rendering) {
                return;
            }
            this._layerUpdating = true;
            yield Promise.all(this._layers.map((layer) => __awaiter(this, void 0, void 0, function* () {
                if (RasterMultiLayer.isInstanceOf(layer)) {
                    yield layer.updateLayer(false);
                }
            })));
            yield this.setData(this.calc);
            this._layerUpdating = false;
        });
    }
}
exports.RasterExpressionLayer = RasterExpressionLayer;


/***/ }),

/***/ "./src/app/geo-web/map/map-layer/map-layer.ts":
/*!****************************************************!*\
  !*** ./src/app/geo-web/map/map-layer/map-layer.ts ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm2015/index.js");
const d3_svg_legend_1 = __webpack_require__(/*! d3-svg-legend */ "./node_modules/d3-svg-legend/indexRollupNext.js");
const d3_1 = __webpack_require__(/*! d3 */ "./node_modules/d3/index.js");
const dates_1 = __webpack_require__(/*! ../../../../../../shared/src/util/dates */ "../shared/src/util/dates.ts");
class MapLayer {
    constructor(name) {
        this.reverseLegendLabels = true;
        this.showLegend = true;
        this.hideLayer = false;
        this.downloadData = { disabled: true };
        /**
         * This will format the original value (not transformed through this.valueTransformation) to display on legend and values mouseover popup
         *
         */
        this.valueFormatFn = (value) => value.toString();
        this.blendModes = [
            "normal",
            "multiply",
            "screen",
            "overlay",
            "darken",
            "lighten",
            "color - dodge",
            "color - burn",
            "hard - light",
            "soft - light",
            "exclusion",
            "hue",
            "saturation",
            "color",
            "luminosity",
        ].map(key => ({
            name: key,
        }));
        this.linkedLayers = [];
        this._visible = false;
        /**
         * Opacity (0 to 1)
         *
         */
        this._opacity = 0.6;
        this._on = new rxjs_1.Subject();
        this._onObservable = this._on.asObservable();
        this._initialised = false;
        this._blendMode = { name: "normal" };
        this.showValueInPopup = true;
        this.onClickPolicy = "selected";
        this.name = name;
        this._legendParent = MapLayer.layerService.layerLegendElement;
    }
    static setLayerService(ls) {
        MapLayer.layerService = ls;
    }
    get minValueTransformed() {
        return typeof this.valueTransformation === "undefined"
            ? undefined
            : this.valueTransformation.func(this.minValue);
    }
    get maxValueTransformed() {
        return typeof this.valueTransformation === "undefined"
            ? undefined
            : this.valueTransformation.func(this.maxValue);
    }
    set minValueTransformed(min) {
        this.minValue =
            typeof this.valueTransformation === "undefined"
                ? undefined
                : this.valueTransformation.inverse(min);
    }
    set maxValueTransformed(max) {
        this.maxValue =
            typeof this.valueTransformation === "undefined"
                ? undefined
                : this.valueTransformation.inverse(max);
    }
    get valueFormat() {
        return this._valueFormat;
    }
    /**
     *  This property provides 'helpers' to set the valueFormatFn property.
     *  This allows JSON values to be resolved into certain functions for valueFormatFn
     *
     */
    set valueFormat(valueFormat) {
        this._valueFormat = valueFormat;
        if (typeof valueFormat === "string") {
            switch (valueFormat) {
                case 'secondsToHMString("hm")':
                    this.valueFormatFn = dates_1.secondsToHMString("hm");
                    break;
                case 'secondsToHMString(":")':
                    this.valueFormatFn = dates_1.secondsToHMString(":");
                    break;
            }
        }
        else {
            // Find max key value in layer.valueFormat
            const maxLayerValue = d3_1.max(Object.keys(valueFormat).map(k => parseFloat(k)));
            this.valueFormatFn = (d) => valueFormat[Math.round(Math.max(Math.min(d, maxLayerValue), 0))];
        }
    }
    get onObservable() {
        return this._onObservable;
    }
    get type() {
        return this._type;
    }
    get visible() {
        return this._visible;
    }
    render(forceRerender) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this.colourScheme === "undefined" ||
                this.colourScheme.type !== "D3ColourScheme" ||
                typeof this.minValue === "undefined" ||
                typeof this.maxValue === "undefined") {
                return;
            }
            if (this.showLegend &&
                (typeof this._legend === "undefined" || forceRerender)) {
                if (typeof this._legend !== "undefined") {
                    this._legend.remove();
                }
                this.colourScheme.setDomain(this.minValue, this.maxValue);
                // Render legend
                const colorLegendInit = d3_svg_legend_1.legendColor()
                    .labels((args) => this.valueFormatFn(parseFloat(args.generatedLabels[args.i])))
                    .labelFormat(d3_1.format(""))
                    .title(`${this.legendTitle || this.name}${typeof this.units !== "undefined" ? ` (${this.units})` : ""}`);
                if (typeof this.legendCells !== "undefined") {
                    colorLegendInit.cells(this.legendCells);
                }
                else {
                    colorLegendInit.cells(6);
                }
                if (typeof this.legendLabels !== "undefined") {
                    colorLegendInit.labels(this.legendLabels);
                }
                // The colour legends must be revesed - as the labels are converted to strings  - they aren't sorted properly
                if ((this.colourScheme.reversed && !this.reverseLegendLabels) ||
                    (!this.colourScheme.reversed && this.reverseLegendLabels)) {
                    colorLegendInit.ascending(true);
                }
                const colorLegend = colorLegendInit.scale(this.colourScheme.scale);
                this._legend = this._legendParent.append("svg");
                this._legend.attr("class", "legend");
                const legendG = this._legend.append("g");
                legendG.call(colorLegend);
                const legendBounds = legendG.node().getBoundingClientRect();
                this._legend
                    .attr("width", legendBounds.width)
                    .attr("height", legendBounds.height);
                if (!this.visible) {
                    this._legend.attr("display", "none");
                }
                else {
                    this._legend.selectAll(".swatch").style("opacity", this._opacity);
                }
            }
        });
    }
    updateLayer(updateLinked = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.render(true);
            if (updateLinked) {
                yield Promise.all(this.linkedLayers.map(layer => layer.updateLayer(false)));
            }
        });
    }
    show() {
        return __awaiter(this, void 0, void 0, function* () {
            // Set legend swatch opacity (to match layer opacity)
            if (typeof this._legend !== "undefined") {
                if (typeof this._legend !== "undefined") {
                    this._legend.style("display", "initial");
                }
                this._legend.selectAll(".swatch").style("opacity", this._opacity);
            }
            this._visible = true;
            this._on.next("show");
        });
    }
    hide() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this._legend !== "undefined") {
                this._legend.style("display", "none");
            }
            this._visible = false;
            this._on.next("hide");
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this._legend !== "undefined") {
                this._legend
                    .transition()
                    .duration(750)
                    .style("margin-bottom", "-100%")
                    .style("height", "0px")
                    .style("opacity", 0)
                    .on("end", (() => this._legend.remove()).bind(this));
            }
            this._on.next("clear");
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.clear();
            this._on.next("delete");
        });
    }
    setZIndex(z) {
        return false;
    }
    /**
     * Get opacity (0 to 100)
     *
     */
    get opacity() {
        return this._opacity * 100;
    }
    /**
     * Set opacity (0 to 100)
     *
     */
    set opacity(o) {
        this._opacity = o / 100;
        if (this.visible) {
            // Set legend swatch opacity (to match layer opacity)
            if (typeof this._legend !== "undefined") {
                this._legend.selectAll(".swatch").style("opacity", this._opacity);
            }
        }
    }
    get blendMode() {
        return this._blendMode;
    }
    set blendMode(b) {
        this._blendMode = b;
    }
    getFeaturesAtPoint(point) {
        return undefined;
    }
    getValueAtPoint(point) {
        return undefined;
    }
}
exports.MapLayer = MapLayer;


/***/ }),

/***/ "./src/app/geo-web/map/map-layer/mapbox-gl-layer.ts":
/*!**********************************************************!*\
  !*** ./src/app/geo-web/map/map-layer/mapbox-gl-layer.ts ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const map_layer_1 = __webpack_require__(/*! ./map-layer */ "./src/app/geo-web/map/map-layer/map-layer.ts");
const colour_scheme_1 = __webpack_require__(/*! ../colour-scheme/colour-scheme */ "./src/app/geo-web/map/colour-scheme/colour-scheme.ts");
const rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm2015/index.js");
const turf_1 = __webpack_require__(/*! @turf/turf */ "./node_modules/@turf/turf/turf.min.js");
class MapboxGlLayer extends map_layer_1.MapLayer {
    constructor(name, _mapboxGlLayer, _source) {
        super(name);
        this._mapboxGlLayer = _mapboxGlLayer;
        this._source = _source;
        this.filterValuesArray = [];
        /**
         * This will disable setting the mapbox filter with the dimensionsArray
         *
         */
        this.disableFilter = false;
        this.blendMode = undefined;
        this.blendModes = [];
        this._opacityPreHide = 1;
        this._onRenderSubject = new rxjs_1.Subject();
        this._onRenderObservable = this._onRenderSubject.asObservable();
        if (typeof this._mapboxGlLayer !== "undefined" &&
            typeof this._mapboxGlLayer.id === "undefined") {
            throw `New MapboxGlLayer ${name}: _mapboxGlLayer.id is undefined`;
        }
        if (typeof this._mapboxGlLayer !== "undefined" &&
            typeof _mapboxGlLayer.filter !== "undefined") {
            this.mapboxFilter = _mapboxGlLayer.filter;
        }
    }
    static isInstanceOf(obj) {
        return "mapboxGlLayer" in obj;
    }
    get colourByProperty() {
        return this._colourByProperty;
    }
    set colourByProperty(colorByProperty) {
        if ("options" in colorByProperty &&
            Array.isArray(colorByProperty.options)) {
            this._colourByProperty = colorByProperty;
        }
        else {
            this._colourByProperty = {
                options: [colorByProperty],
                selected: colorByProperty,
            };
        }
    }
    //Setup getter for population
    get population() {
        return this._population;
    }
    //Set population values
    set population(population) {
        if ("options" in population &&
            Array.isArray(population.options)) {
            this._population = population;
        }
        else {
            this._population = {
                options: [population],
                selected: population,
            };
        }
    }
    //Setup getter for fires
    get fire() {
        return this._fire;
    }
    //Set population values
    set fire(fire) {
        if ("options" in fire &&
            Array.isArray(fire.options)) {
            this._fire = fire;
        }
        else {
            this._fire = {
                options: [fire],
                selected: fire,
            };
        }
    }
    //Setup getter for evac messages
    get evacMessage() {
        return this._evacMessage;
    }
    //Set evacuation message values
    set evacMessage(message) {
        if ("options" in message &&
            Array.isArray(message.options)) {
            this._evacMessage = message;
        }
        else {
            this._evacMessage = {
                options: [message],
                selected: message,
            };
        }
    }
    // Return maximum speed on road network
    get speed() {
        return this._speed;
    }
    //setup maximum speed on road network
    set speed(speed) {
        this._speed = speed;
    }
    // Return animationspeed for simulation
    get animationSpeed() {
        return this._animationSpeed;
    }
    //setup animationspeed for simulation
    set animationSpeed(speed) {
        this._animationSpeed = speed;
    }
    // Return value in time slider
    get time() {
        return this._time;
    }
    //setup value in time slider
    set time(time) {
        this._time = time;
    }
    get onRenderObservable() {
        return this._onRenderObservable;
    }
    get minValue() {
        return this._minValue;
    }
    set minValue(v) {
        this._minValue = v;
        if (typeof this._colourByProperty !== "undefined" &&
            typeof this._colourByProperty.selected.minValue !== "undefined") {
            this._colourByProperty.selected.minValue = v;
        }
    }
    get maxValue() {
        return this._maxValue;
    }
    set maxValue(v) {
        this._maxValue = v;
        if (typeof this._colourByProperty !== "undefined" &&
            typeof this._colourByProperty.selected.maxValue !== "undefined") {
            this._colourByProperty.selected.maxValue = v;
        }
    }
    get mapboxGlLayer() {
        return this._mapboxGlLayer;
    }
    get sourceId() {
        return this._source.id;
    }
    render(force = false) {
        const _super = Object.create(null, {
            render: { get: () => super.render }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this._mapboxGlLayer === "undefined") {
                return;
            }
            if (typeof this._mapboxGlLayer.paint === "undefined") {
                this._mapboxGlLayer.paint = {};
            }
            const addedToMap = typeof map_layer_1.MapLayer.layerService.mapboxGl.getLayer(this.mapboxGlLayer.id) !==
                "undefined";
            if (!this._initialised || force) {
                // Initialise filter
                this._mapboxGlLayer.filter =
                    typeof this.mapboxFilter === "undefined"
                        ? ["all"]
                        : ["all", this.mapboxFilter];
                // Set Filter from dimensionsArray
                if (typeof this.dimensionsArray !== "undefined" && !this.disableFilter) {
                    this._mapboxGlLayer.filter.push(...this.dimensionsArray.map(dim => [
                        "==",
                        ["get", dim.key],
                        dim.selected.value,
                    ]));
                }
                // Set Filter from valu
                this._mapboxGlLayer.filter.push(...this.filterValuesArray.reduce((filter, current) => {
                    if (typeof current.minValue !== "undefined") {
                        filter.push([">=", ["get", current.key], current.minValue]);
                    }
                    if (typeof current.maxValue !== "undefined") {
                        filter.push(["<=", ["get", current.key], current.maxValue]);
                    }
                    return filter;
                }, []));
                // Set colour scale
                if (typeof this.colourScheme !== "undefined" &&
                    colour_scheme_1.D3ColourScheme.isInstanceOf(this.colourScheme) &&
                    typeof this._colourByProperty !== "undefined") {
                    const selectedColByProp = this._colourByProperty.selected;
                    // Update min/max values if defined in colorByProperty
                    if (typeof selectedColByProp.minValue !== "undefined") {
                        this.minValue = selectedColByProp.minValue;
                    }
                    if (typeof selectedColByProp.maxValue !== "undefined") {
                        this.maxValue = selectedColByProp.maxValue;
                    }
                    this.colourScheme.setDomain(this.minValue, this.maxValue);
                    let colourExpression;
                    // If data has been provided to colour by -> see https://docs.mapbox.com/mapbox-gl-js/example/data-join/
                    if (typeof selectedColByProp.dataToJoin !== "undefined") {
                        colourExpression = ["match", ["get", selectedColByProp.key]];
                        // Calculate color for each data value
                        selectedColByProp.dataToJoin.forEach(value => {
                            colourExpression.push(value.featureValue, this.colourScheme.scale(value.dataValue));
                        });
                        // Last value is the default, used where there is no data
                        colourExpression.push("rgba(0,0,0,0)");
                        // Otherwise, we are colouring by a property contained in each feature
                    }
                    else {
                        colourExpression = this.colourScheme.toMapbox(selectedColByProp.key);
                        // Set filter to remove null values
                        this._mapboxGlLayer.filter.push([
                            "!=",
                            ["get", selectedColByProp.key],
                            null,
                        ]);
                    }
                    // Update map layer
                    if (addedToMap) {
                        map_layer_1.MapLayer.layerService.mapboxGl.setPaintProperty(this.mapboxGlLayer.id, `${this.mapboxGlLayer.type}-color`, colourExpression);
                    }
                    else {
                        this._mapboxGlLayer.paint[`${this.mapboxGlLayer.type}-color`] = colourExpression;
                    }
                }
                else if (typeof this.colourScheme !== "undefined" &&
                    colour_scheme_1.SolidColourScheme.isInstanceOf(this.colourScheme)) {
                    if (addedToMap) {
                        map_layer_1.MapLayer.layerService.mapboxGl.setPaintProperty(this.mapboxGlLayer.id, `${this.mapboxGlLayer.type}-color`, this.colourScheme.solidColour);
                    }
                    else {
                        this._mapboxGlLayer.paint[`${this.mapboxGlLayer.type}-color`] = this.colourScheme.solidColour;
                    }
                }
                // Delete filter if === ["all"]
                if (this._mapboxGlLayer.filter.length === 1 &&
                    this._mapboxGlLayer.filter[0] === "all") {
                    delete this._mapboxGlLayer.filter;
                }
                if (addedToMap && typeof this._mapboxGlLayer.filter !== "undefined") {
                    map_layer_1.MapLayer.layerService.mapboxGl.setFilter(this.mapboxGlLayer.id, this._mapboxGlLayer.filter);
                }
            }
            if (!addedToMap) {
                this._mapboxGlLayer.paint[`${this.mapboxGlLayer.type}-opacity`] = this._opacity;
                if (typeof this._source !== "undefined") {
                    if (typeof map_layer_1.MapLayer.layerService.mapboxGl.getSource(this._source.id) !==
                        "undefined") {
                        map_layer_1.MapLayer.layerService.mapboxGl.removeSource(this._source.id);
                    }
                    map_layer_1.MapLayer.layerService.mapboxGl.addSource(this._source.id, this._source.source);
                }
                map_layer_1.MapLayer.layerService.mapboxGl.addLayer(this.mapboxGlLayer);
                this._initialised = true;
            }
            yield _super.render.call(this, force);
            this._onRenderSubject.next();
        });
    }
    updateLayerFilter() {
        map_layer_1.MapLayer.layerService.mapboxGl.setFilter(this.mapboxGlLayer.id, this.mapboxGlLayer.filter);
    }
    show() {
        const _super = Object.create(null, {
            show: { get: () => super.show }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield this.render();
            if (this.opacity === 0) {
                this.opacity = this._opacityPreHide * 100;
            }
            yield _super.show.call(this);
        });
    }
    hide() {
        const _super = Object.create(null, {
            hide: { get: () => super.hide }
        });
        return __awaiter(this, void 0, void 0, function* () {
            this._opacityPreHide = this._opacity;
            this.opacity = 0;
            yield _super.hide.call(this);
        });
    }
    clear() {
        const _super = Object.create(null, {
            clear: { get: () => super.clear }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this.mapboxGlLayer !== "undefined" &&
                typeof map_layer_1.MapLayer.layerService.mapboxGl.getLayer(this.mapboxGlLayer.id) !==
                    "undefined") {
                map_layer_1.MapLayer.layerService.mapboxGl.removeLayer(this.mapboxGlLayer.id);
            }
            if (typeof this._source !== "undefined" &&
                typeof map_layer_1.MapLayer.layerService.mapboxGl.getSource(this._source.id) !==
                    "undefined") {
                map_layer_1.MapLayer.layerService.mapboxGl.removeSource(this._source.id);
            }
            yield _super.clear.call(this);
        });
    }
    /**
     * FIXME: sometimes this hangs before a layer has been added.
     *
     */
    set opacity(o) {
        super.opacity = o;
        if (typeof map_layer_1.MapLayer.layerService.mapboxGl.getLayer(this.mapboxGlLayer.id) !==
            "undefined") {
            map_layer_1.MapLayer.layerService.mapboxGl.setPaintProperty(this.mapboxGlLayer.id, `${this.mapboxGlLayer.type}-opacity`, o / 100);
        }
    }
    get opacity() {
        return this._opacity * 100;
    }
    getPolygonAtPoint(pointOrBox) {
        if (typeof this.idByProperty === "undefined") {
            throw "Layer idByProperty must be defined to call getPolygonAtPoint()";
        }
        let filter = this._mapboxGlLayer.filter;
        // Get one feature under mouse
        const renderedFeatures = map_layer_1.MapLayer.layerService.mapboxGl.queryRenderedFeatures(pointOrBox, { layers: [this.mapboxGlLayer.id] })[0];
        if (typeof renderedFeatures === "undefined") {
            return undefined;
        }
        // Create new filter which merges current filter, with idByProperty (to find parts of the feature under mouse)
        if (typeof filter === "undefined") {
            filter = ["all"];
        }
        const found = map_layer_1.MapLayer.layerService.mapboxGl.queryRenderedFeatures(undefined, {
            layers: [this.mapboxGlLayer.id],
            filter: [
                ...filter,
                [
                    "==",
                    ["get", this.idByProperty],
                    renderedFeatures.properties[this.idByProperty],
                ],
            ],
        });
        if (found.length === 0) {
            return undefined;
        }
        // Return merged polygon
        return [turf_1.union(...found)];
    }
    getPointFeatureAtPoint(pointOrBox) {
        const f = map_layer_1.MapLayer.layerService.mapboxGl.queryRenderedFeatures(pointOrBox, {
            layers: [this.mapboxGlLayer.id],
        });
        return f;
    }
    getFeaturesAtPoint(point, buffer = 0) {
        let pointOrBox = map_layer_1.MapLayer.layerService.mapboxGl.project(point.latlng);
        if (buffer !== 0) {
            pointOrBox = [
                [pointOrBox.x - buffer, pointOrBox.y - buffer],
                [pointOrBox.x + buffer, pointOrBox.y + buffer],
            ];
        }
        if (this.mapboxGlLayer.type === "fill" ||
            this.mapboxGlLayer.type === "line") {
            return this.getPolygonAtPoint(pointOrBox);
        }
        if (this.mapboxGlLayer.type === "circle" ||
            this.mapboxGlLayer.type === "symbol") {
            return this.getPointFeatureAtPoint(pointOrBox);
        }
        return undefined;
    }
    getValueAtPoint(point) {
        if (typeof this._colourByProperty === "undefined") {
            return undefined;
        }
        const layer = map_layer_1.MapLayer.layerService.mapboxGl.queryRenderedFeatures(map_layer_1.MapLayer.layerService.mapboxGl.project(point.latlng), { layers: [this.mapboxGlLayer.id] })[0];
        if (typeof layer === "undefined") {
            return undefined;
        }
        if (typeof this._colourByProperty.selected.dataToJoin === "undefined") {
            return layer.properties[this._colourByProperty.selected.key];
        }
        const value = this._colourByProperty.selected.dataToJoin.find(data => data.featureValue ===
            layer.properties[this._colourByProperty.selected.key]);
        return typeof value === "undefined" ? undefined : value.dataValue;
    }
}
exports.MapboxGlLayer = MapboxGlLayer;


/***/ }),

/***/ "./src/app/geo-web/map/map-layer/time-slider.ts":
/*!******************************************************!*\
  !*** ./src/app/geo-web/map/map-layer/time-slider.ts ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class TimeSlider {
    constructor() {
        this.subscribers = new Set();
    }
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
        this._valueDate = new Date(this.minDate.getTime() + this._value * 1000);
        this.subscribers.forEach(sub => sub.onSliderValueChange(this._value, this._valueDate));
    }
    get valueDate() {
        return this._valueDate;
    }
    set valueDate(value) {
        this._valueDate = value;
        this._value = (this._valueDate.getTime() - this.minDate.getTime()) / 1000;
        this.subscribers.forEach(sub => sub.onSliderValueChange(this._value, this._valueDate));
    }
    timeSliderValueChange(event) { }
    timeSliderDateChange(event) { }
}
exports.TimeSlider = TimeSlider;
function instanceOfTimeSliderSubscriber(object) {
    return ("slider" in object &&
        "sliderEnabled" in object &&
        "onSliderValueChange" in object);
}
exports.instanceOfTimeSliderSubscriber = instanceOfTimeSliderSubscriber;


/***/ }),

/***/ "./src/app/geo-web/map/map-popup/map-popup-component.ts":
/*!**************************************************************!*\
  !*** ./src/app/geo-web/map/map-popup/map-popup-component.ts ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const map_popup_service_1 = __webpack_require__(/*! ./map-popup.service */ "./src/app/geo-web/map/map-popup/map-popup.service.ts");
const core_2 = __webpack_require__(/*! @ng-dynamic-forms/core */ "./node_modules/@ng-dynamic-forms/core/fesm2015/core.js");
let PopupFormComponent = class PopupFormComponent {
    constructor(popupService, formService) {
        this.popupService = popupService;
        this.formService = formService;
        // Amount of X pixels to translate the caret (so it aligns with the original coordinates)
        this.caretTranslateX = 0;
        this.onEnterKeyPress = e => {
            if (e.key === "Enter") {
                this.save();
                e.srcElement.blur();
            }
        };
        this._popupSubject = popupService
            .getPopupSubject()
            .subscribe(popupMessage => this.updatePopup(popupMessage));
    }
    set visible(v) {
        this._visible = v;
    }
    get visible() {
        return this._visible;
    }
    ngOnDestroy() {
        this._popupSubject.unsubscribe();
    }
    updatePopup(popupMessage) {
        if (typeof popupMessage === "undefined") {
            this._visible = false;
        }
        else {
            this.currentPopup = popupMessage;
            // Position the popup above or below the cformOnCancelFnoordinates if y-value is above/below middle of screen
            this.position =
                this.currentPopup.coordinates.y >
                    Math.max(document.documentElement.clientHeight, window.innerHeight || 0) /
                        2
                    ? "top"
                    : "bottom";
            // Update coordinates and caret (triangle) position if they are outidse the bounds (160px, 100%-160px)
            const minX = 160;
            const maxX = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) -
                minX;
            this.caretTranslateX = 0;
            if (this.currentPopup.coordinates.x < minX) {
                this.caretTranslateX = Math.min(minX - this.currentPopup.coordinates.x, 135);
                this.currentPopup.coordinates.x = minX;
            }
            else if (this.currentPopup.coordinates.x > maxX) {
                this.caretTranslateX = Math.max(maxX - this.currentPopup.coordinates.x, -135);
                this.currentPopup.coordinates.x = maxX;
            }
            // If the form model/schema has changed -> create new form
            if (this.formModel !== popupMessage.formSchema) {
                this.formModel = popupMessage.formSchema;
                if (typeof this.formModel !== "undefined") {
                    this.formGroup = this.formService.createFormGroup(this.formModel);
                }
            }
            if (typeof this.formGroup !== "undefined" &&
                typeof this.currentPopup.model !== "undefined") {
                // Must be patchValue and not setValue - as setValue will throw an error if the model contains keys which don't exist in the form
                this.formGroup.patchValue(this.currentPopup.model);
            }
            this._visible = true;
        }
    }
    save() {
        if (typeof this.currentPopup.formOnSubmitFn === "function") {
            this.currentPopup.formOnSubmitFn(typeof this.formGroup !== "undefined" ? this.formGroup.value : undefined);
        }
        this._visible = false;
        this.currentPopup = undefined;
    }
    cancel() {
        if (typeof this.currentPopup.formOnCancelFn === "function") {
            this.currentPopup.formOnCancelFn();
        }
        this._visible = false;
        this.currentPopup = undefined;
    }
    dangerBtnClick() {
        if (typeof this.currentPopup.dangerBtn !== "undefined" &&
            typeof this.currentPopup.dangerBtn.onClickFn === "function") {
            this.currentPopup.dangerBtn.onClickFn();
            this.cancel();
        }
    }
};
__decorate([
    core_1.ViewChild("popupContainer"),
    __metadata("design:type", core_1.ElementRef)
], PopupFormComponent.prototype, "mainMenu", void 0);
PopupFormComponent = __decorate([
    core_1.Component({
        selector: "app-map-popup",
        template: __webpack_require__(/*! ./map-popup.component.html */ "./src/app/geo-web/map/map-popup/map-popup.component.html"),
        encapsulation: core_1.ViewEncapsulation.None,
        styles: [__webpack_require__(/*! ./map-popup.component.scss */ "./src/app/geo-web/map/map-popup/map-popup.component.scss")]
    }),
    __metadata("design:paramtypes", [map_popup_service_1.PopupFormService,
        core_2.DynamicFormService])
], PopupFormComponent);
exports.PopupFormComponent = PopupFormComponent;


/***/ }),

/***/ "./src/app/geo-web/map/map-popup/map-popup.component.html":
/*!****************************************************************!*\
  !*** ./src/app/geo-web/map/map-popup/map-popup.component.html ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"popup-background\"\n  [hidden]=\"!visible || currentPopup === undefined || !currentPopup.background\"></div>\n<div [class]=\"'popup-container popup-container-' + position\"\n  [ngClass]=\"{'background': currentPopup.background}\"\n  [style.left]=\"currentPopup.coordinates.x + 'px'\"\n  [style.top]=\"currentPopup.coordinates.y + 'px'\"\n  *ngIf=\"visible && currentPopup !== undefined\"\n  #popupContainer>\n  <div class=\"caret-up\"\n    [style.left]=\"'calc(50% - ' + caretTranslateX + 'px)'\">\n    <fa-icon [icon]=\"['fas', 'caret-up']\"\n      size=\"sm\"></fa-icon>\n  </div>\n  <p-card [header]=\"currentPopup.title\"\n    styleClass=\"ui-card-shadow\">\n    <div class=\"form\"\n      *ngIf=\"formGroup !== undefined\">\n      <form [formGroup]=\"formGroup\">\n        <dynamic-primeng-form [group]=\"formGroup\"\n          [model]=\"formModel\"\n          (keyup)=\"onEnterKeyPress($event)\"></dynamic-primeng-form>\n      </form>\n    </div>\n    <p-footer>\n      <button type=\"button\"\n        pButton\n        icon=\"pi pi-trash\"\n        (click)=\"dangerBtnClick()\"\n        [label]=\"currentPopup.dangerBtn.label\"\n        class=\"ui-button-danger-outline\"\n        style=\"float: left;margin-left: 0 !important;\"\n        *ngIf=\"currentPopup.dangerBtn !== undefined\"></button>\n      <button pButton\n        *ngIf=\"!currentPopup.hideCancelBtn\"\n        type=\"button\"\n        [label]=\"currentPopup.cancelBtnLabel || 'Cancel'\"\n        icon=\"pi pi-times\"\n        class=\"ui-button-secondary\"\n        (click)=\"cancel()\"></button>\n      <button pButton\n        type=\"button\"\n        [label]=\"currentPopup.submitBtnLabel || 'Save'\"\n        icon=\"pi pi-check\"\n        style=\"margin-right: .25em\"\n        (click)=\"save()\"\n        [disabled]=\"formGroup !== undefined && !formGroup.valid\"></button>\n    </p-footer>\n  </p-card>\n</div>"

/***/ }),

/***/ "./src/app/geo-web/map/map-popup/map-popup.component.scss":
/*!****************************************************************!*\
  !*** ./src/app/geo-web/map/map-popup/map-popup.component.scss ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".fake-leaflet-control,\n.fake-leaflet-control-lg,\n.fake-leaflet-control-colours,\n.popup-container .ui-card {\n  color: #333;\n  background: #fff;\n  border-radius: 4px;\n  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);\n  border: none;\n  background-clip: padding-box; }\n\n.fake-leaflet-control.active,\n.fake-leaflet-control-lg.active,\n.fake-leaflet-control-colours.active,\n.popup-container .active.ui-card {\n  background-color: #007ad9;\n  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);\n  color: #ffffff; }\n\n.fake-leaflet-control,\n.fake-leaflet-control-lg {\n  margin-bottom: 10px;\n  position: relative; }\n\n.fake-leaflet-control {\n  height: 30px;\n  width: 30px; }\n\n.fake-leaflet-control-lg {\n  height: 44px;\n  width: 44px; }\n\n.fake-leaflet-control a,\n.fake-leaflet-control-lg a {\n  color: inherit;\n  height: 100%;\n  width: 100%;\n  display: block;\n  line-height: 0; }\n\n.fake-leaflet-control:hover,\n.fake-leaflet-control-lg:hover {\n  background-color: #f4f4f4; }\n\n.fake-leaflet-control a:hover,\n.fake-leaflet-control-lg a:hover {\n  color: #333;\n  cursor: pointer; }\n\n.fake-leaflet-control.active:hover,\n.fake-leaflet-control-lg.active:hover {\n  background-color: #1775bd; }\n\n.fake-leaflet-control.active a:hover,\n.fake-leaflet-control-lg.active a:hover,\n.fake-leaflet-control-colours.active a:hover,\n.popup-container .active.ui-card a:hover {\n  color: #ffffff; }\n\n.fake-leaflet-control fa-icon.ng-fa-icon,\n.fake-leaflet-control-lg fa-icon.ng-fa-icon {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%); }\n\n.fake-leaflet-control a {\n  font-size: 12px; }\n\n.fake-leaflet-control-lg a {\n  font-size: 24px; }\n\n.fake-leaflet-control-lg span {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%); }\n\n* {\n  box-sizing: border-box; }\n\nbody,\nhtml {\n  font-family: Roboto, \"Helvetica Neue\", Helvetica, Arial, sans-serif !important;\n  font-size: 14px;\n  margin: 0;\n  padding: 0; }\n\n.c3 text {\n  font-family: Roboto, \"Helvetica Neue\", Helvetica, Arial, sans-serif !important;\n  font-size: 14px; }\n\nh1,\n.h1 {\n  font-size: 24px;\n  font-weight: 600; }\n\nh2,\n.h2 {\n  font-size: 18px;\n  font-weight: 500; }\n\npre {\n  word-break: break-word;\n  overflow-x: auto;\n  white-space: pre-wrap;\n  white-space: -moz-pre-wrap;\n  white-space: -pre-wrap;\n  white-space: -o-pre-wrap;\n  word-wrap: break-word; }\n\n.font-italic-light {\n  font-weight: 100;\n  font-style: italic; }\n\n.text-overflow-ellipsis {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis; }\n\n.label, label,\nlabel {\n  display: block;\n  margin-bottom: 10px;\n  margin-top: 20px; }\n\n.badge > .pi {\n  padding-right: 4px; }\n\na.icon-link:last-of-type {\n  padding-right: 10px; }\n\na.icon-link:first-of-type {\n  padding-left: 10px; }\n\na.icon-link {\n  font-size: 0.85em;\n  padding: 0 5px; }\n\nbody .ui-widget-overlay {\n  background-color: rgba(0, 0, 0, 0.2);\n  transition: all linear 0.2s; }\n\n.ui-state-highlight a.icon-link {\n  color: #ffffff; }\n\n.ui-state-highlight a.icon-link:hover {\n  color: #ffffffba; }\n\n.empty-placeholder {\n  color: #999;\n  font-weight: 100;\n  padding: 20px 0;\n  /* height: 100%; */\n  text-align: center; }\n\n.ui-toast {\n  max-height: 100vh;\n  overflow-y: auto; }\n\n.ui-toast-detail {\n  word-break: break-word; }\n\n.modal-dialog.ui-dialog {\n  width: 400px; }\n\n.ui-dialog .ui-grid .ui-grid-row {\n  margin-bottom: 10px; }\n\n.ui-dialog .ui-listbox .ui-listbox-list-wrapper {\n  max-height: calc(100vh - 400px);\n  min-height: 100px; }\n\nbody .ui-dialog .ui-dialog-content {\n  max-height: calc(100vh - 200px);\n  min-height: 200px;\n  overflow-y: auto;\n  overflow-y: overlay;\n  -ms-overflow-style: -ms-autohiding-scrollbar;\n  border-left: none;\n  border-right: none; }\n\nbody .ui-dialog .ui-dialog-titlebar,\nbody .ui-dialog .ui-dialog-footer {\n  border-left: none;\n  border-right: none; }\n\nbody .ui-dialog .ui-dialog-titlebar {\n  border-top: none; }\n\nbody .ui-dialog .ui-dialog-footer {\n  border-bottom: none; }\n\n.ui-dialog .ui-listbox .ui-progressbar {\n  display: inline-block;\n  width: 100%;\n  height: 14px;\n  margin-top: 3px;\n  margin-bottom: -3px;\n  background-color: #0000004a; }\n\n.ui-dialog .ui-listbox .ui-progressbar .ui-progressbar-label {\n  font-size: 12px;\n  line-height: 1.25;\n  color: inherit; }\n\n.ui-dialog .ui-listbox .ui-progressbar .ui-progressbar-value {\n  background: #0000006b; }\n\nbody .ui-widget,\nbody .ui-autocomplete.ui-autocomplete-multiple .ui-autocomplete-multiple-container .ui-autocomplete-input-token input,\nbody .ui-chips > ul.ui-inputtext .ui-chips-input-token input,\nbody .ui-table .ui-editable-column input,\nbody .ui-treetable .ui-editable-column input,\nbody .ui-terminal .ui-terminal-input {\n  font-family: Roboto, \"Helvetica Neue\", Helvetica, Arial, sans-serif !important; }\n\nbody .secondary-col,\nbody .ui-button.ui-state-default.ui-button-secondary,\nbody .ui-buttonset.ui-button-secondary > .ui-button.ui-state-default {\n  color: #333333;\n  background-color: #e8e8e8;\n  border-color: #e8e8e8; }\n\nbody .secondary-col:hover,\nbody .ui-button.ui-state-default.ui-button-secondary:enabled:hover,\nbody .ui-buttonset.ui-button-secondary > .ui-button.ui-state-default:enabled:hover {\n  background-color: #c8c8c8;\n  color: #333333;\n  border-color: #c8c8c8; }\n\nbody .secondary-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-secondary:enabled:focus,\nbody .ui-buttonset.ui-button-secondary > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #8dcdff; }\n\nbody .secondary-col:active,\nbody .ui-button.ui-state-default.ui-button-secondary:enabled:active,\nbody .ui-buttonset.ui-button-secondary > .ui-button.ui-state-default:enabled:active {\n  background-color: #a0a0a0;\n  color: #333333;\n  border-color: #a0a0a0; }\n\nbody .default-col,\nbody .ui-button.ui-state-default.ui-button-info,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default {\n  color: #ffffff;\n  background-color: #007ad9;\n  border-color: #007ad9; }\n\nbody .default-col:hover,\nbody .ui-button.ui-state-default.ui-button-info:enabled:hover,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default:enabled:hover {\n  background-color: #116fbf;\n  color: #ffffff;\n  border-color: #116fbf; }\n\nbody .default-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-info:enabled:focus,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #8dcdff; }\n\nbody .default-col:active,\nbody .ui-button.ui-state-default.ui-button-info:enabled:active,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default:enabled:active {\n  background-color: #005b9f;\n  color: #ffffff;\n  border-color: #005b9f; }\n\nbody .success-col,\nbody .ui-button.ui-state-default.ui-button-success,\nbody .ui-buttonset.ui-button-success > .ui-button.ui-state-default {\n  color: #ffffff;\n  background-color: #34a835;\n  border-color: #34a835; }\n\nbody .success-col:hover,\nbody .ui-button.ui-state-default.ui-button-success:enabled:hover,\nbody .ui-buttonset.ui-button-success > .ui-button.ui-state-default:enabled:hover {\n  background-color: #107d11;\n  color: #ffffff;\n  border-color: #107d11; }\n\nbody .success-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-success:enabled:focus,\nbody .ui-buttonset.ui-button-success > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #aae5aa; }\n\nbody .success-col:active,\nbody .ui-button.ui-state-default.ui-button-success:enabled:active,\nbody .ui-buttonset.ui-button-success > .ui-button.ui-state-default:enabled:active {\n  background-color: #0c6b0d;\n  color: #ffffff;\n  border-color: #0c6b0d; }\n\nbody .success-col-outline,\nbody .ui-button.ui-state-default.ui-button-success-outline,\nbody .ui-buttonset.ui-button-success-outline > .ui-button.ui-state-default {\n  color: #34a835;\n  background-color: #fff;\n  border-color: #fff; }\n\nbody .success-col-outline:hover,\nbody .ui-button.ui-state-default.ui-button-success-outline:enabled:hover,\nbody .ui-buttonset.ui-button-success-outline > .ui-button.ui-state-default:enabled:hover {\n  background-color: #fff;\n  color: #107d11;\n  border-color: #fff; }\n\nbody .success-col-outline:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-success-outline:enabled:focus,\nbody .ui-buttonset.ui-button-success-outline > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #aae5aa; }\n\nbody .success-col-outline:active,\nbody .ui-button.ui-state-default.ui-button-success-outline:enabled:active,\nbody .ui-buttonset.ui-button-success-outline > .ui-button.ui-state-default:enabled:active {\n  background-color: #fff;\n  color: #0c6b0d;\n  border-color: #fff; }\n\nbody .warning-col,\nbody .ui-button.ui-state-default.ui-button-warning,\nbody .ui-buttonset.ui-button-warning > .ui-button.ui-state-default {\n  color: #333333;\n  background-color: #ffba01;\n  border-color: #ffba01; }\n\nbody .warning-col:hover,\nbody .ui-button.ui-state-default.ui-button-warning:enabled:hover,\nbody .ui-buttonset.ui-button-warning > .ui-button.ui-state-default:enabled:hover {\n  background-color: #ed990b;\n  color: #333333;\n  border-color: #ed990b; }\n\nbody .warning-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-warning:enabled:focus,\nbody .ui-buttonset.ui-button-warning > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #ffeab4; }\n\nbody .warning-col:active,\nbody .ui-button.ui-state-default.ui-button-warning:enabled:active,\nbody .ui-buttonset.ui-button-warning > .ui-button.ui-state-default:enabled:active {\n  background-color: #d38b10;\n  color: #333333;\n  border-color: #d38b10; }\n\nbody .danger-col,\nbody .ui-button.ui-state-default.ui-button-danger,\nbody .ui-buttonset.ui-button-danger > .ui-button.ui-state-default {\n  color: #ffffff;\n  background-color: #e91224;\n  border-color: #e91224; }\n\nbody .danger-col:hover,\nbody .ui-button.ui-state-default.ui-button-danger:enabled:hover,\nbody .ui-buttonset.ui-button-danger > .ui-button.ui-state-default:enabled:hover {\n  background-color: #c01120;\n  color: #ffffff;\n  border-color: #c01120; }\n\nbody .danger-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-danger:enabled:focus,\nbody .ui-buttonset.ui-button-danger > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #f9b4ba; }\n\nbody .danger-col:active,\nbody .ui-button.ui-state-default.ui-button-danger:enabled:active,\nbody .ui-buttonset.ui-button-danger > .ui-button.ui-state-default:enabled:active {\n  background-color: #a90000;\n  color: #ffffff;\n  border-color: #a90000; }\n\nbody .danger-col-outline,\nbody .ui-button.ui-state-default.ui-button-danger-outline,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default {\n  color: #e91224;\n  background-color: #fff;\n  border-color: #fff; }\n\nbody .ui-button.ui-state-default.ui-button-danger-outline,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default {\n  border-color: #e91224; }\n\nbody .danger-col-outline:hover,\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:hover,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:hover {\n  background-color: #fff;\n  color: #c01120;\n  border-color: #fff; }\n\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:hover,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:hover {\n  border-color: #c01120; }\n\nbody .danger-col-outline:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:focus,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #f9b4ba; }\n\nbody .danger-col-outline:active,\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:active,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:active {\n  background-color: #fff;\n  color: #a90000;\n  border-color: #fff; }\n\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:active,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:active {\n  border-color: #a90000; }\n\nbody .ui-dialog .ui-dialog-footer button,\nbody .ui-card .ui-card-footer button {\n  margin: 0 0 0 0.5em !important; }\n\nbody .ui-dialog {\n  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1) !important; }\n\nbody .ui-dialog .ui-dialog-titlebar {\n  border-radius: 4px 4px 0 0; }\n\nbody .ui-dialog .ui-dialog-footer {\n  border-radius: 0 0 4px 4px; }\n\nbody .ui-messages-error {\n  border: none;\n  font-weight: 800;\n  padding: 0;\n  display: block;\n  width: 100%;\n  text-align: right;\n  color: #a80000; }\n\nbody .ng-dirty.ng-invalid + ul {\n  -webkit-padding-start: 0;\n          padding-inline-start: 0; }\n\nbody .ui-inputtext.ng-invalid:enabled:focus,\n.ui-inputtext {\n  border-color: #a80000; }\n\nbody .ui-inputtext,\nbody .ui-inputgroup .ui-inputtext.ng-dirty.ng-invalid + .ui-inputgroup-addon {\n  transition: box-shadow 0.2s; }\n\nbody .ui-inputtext.ng-dirty.ng-invalid,\nbody p-dropdown.ng-dirty.ng-invalid > .ui-dropdown,\nbody p-autocomplete.ng-dirty.ng-invalid > .ui-autocomplete > .ui-inputtext,\nbody p-calendar.ng-dirty.ng-invalid > .ui-calendar > .ui-inputtext,\nbody p-chips.ng-dirty.ng-invalid > .ui-inputtext,\nbody p-inputmask.ng-dirty.ng-invalid > .ui-inputtext,\nbody p-checkbox.ng-dirty.ng-invalid .ui-chkbox-box,\nbody p-radiobutton.ng-dirty.ng-invalid .ui-radiobutton-box,\nbody p-inputswitch.ng-dirty.ng-invalid .ui-inputswitch,\nbody p-listbox.ng-dirty.ng-invalid .ui-inputtext,\nbody p-multiselect.ng-dirty.ng-invalid > .ui-multiselect,\nbody p-spinner.ng-dirty.ng-invalid > .ui-inputtext,\nbody p-selectbutton.ng-dirty.ng-invalid .ui-button,\nbody p-togglebutton.ng-dirty.ng-invalid .ui-button {\n  box-shadow: 0 0 0 0.2em #f9b4ba; }\n\nbody .ui-inputgroup .ui-inputtext.ng-dirty.ng-invalid + .ui-inputgroup-addon {\n  box-shadow: 2px -2.8px 0 #f9b4ba, 2px 2.8px 0 #f9b4ba; }\n\nbody p-calendar.ng-dirty.ng-invalid > .ui-calendar.ui-calendar-w-btn {\n  box-shadow: 0 0 0 3px #f9b4ba;\n  border-radius: 4px; }\n\nbody .ui-inputgroup .ui-inputtext:enabled:focus:not(.ui-state-error) + .ui-inputgroup-addon,\nbody p-calendar.ng-dirty.ng-invalid > .ui-calendar > .ui-inputtext:enabled:focus:not(.ui-state-error),\nbody p-calendar.ng-dirty.ng-invalid > .ui-calendar > .ui-inputtext:enabled:focus:not(.ui-state-error) + .ui-calendar-button {\n  box-shadow: none; }\n\n*:not(.ui-calendar) .ui-inputtext {\n  width: 100%; }\n\nbody .ui-state-disabled,\nbody .ui-widget:disabled {\n  cursor: not-allowed; }\n\n.form dynamic-primeng-form-control > div {\n  margin-bottom: 10px; }\n\n.form .ui-calendar,\n.form .ui-spinner {\n  width: 100%; }\n\n.form .ui-calendar-w-btn input.ui-inputtext {\n  width: calc(100% - 33px); }\n\n.form .ui-datepicker {\n  padding: 0.5em; }\n\n.form .ui-datepicker {\n  font-size: 12px; }\n\n.form .ui-datepicker .ui-timepicker {\n  padding: 10px 0 0 0;\n  font-size: 11px; }\n\n.form .ui-datepicker table {\n  font-size: 11px; }\n\n/* width */\n\n::-webkit-scrollbar {\n  width: 10px; }\n\n/* Track */\n\n::-webkit-scrollbar-track {\n  background: none; }\n\n/* Handle */\n\n::-webkit-scrollbar-thumb {\n  background: #00000033;\n  border: 2px solid rgba(0, 0, 0, 0);\n  background-clip: padding-box;\n  border-radius: 5px; }\n\n/* Handle on hover */\n\n::-webkit-scrollbar-thumb:hover {\n  background: #00000055;\n  background-clip: padding-box; }\n\n.popup-container {\n  z-index: 1502;\n  position: absolute;\n  top: 5px;\n  left: 0;\n  transform: translateX(-50%);\n  width: 300px; }\n\n.popup-container-top {\n  transform: translate(-50%, -100%); }\n\n.popup-container.background .ui-card {\n  box-shadow: none; }\n\n.popup-container .caret-up {\n  color: white;\n  font-size: 36px;\n  position: absolute;\n  left: 50%;\n  -webkit-filter: drop-shadow(0px -2px 0px rgba(0, 0, 0, 0.4));\n          filter: drop-shadow(0px -2px 0px rgba(0, 0, 0, 0.4)); }\n\n.popup-container-bottom .caret-up {\n  top: -25px;\n  transform: translateX(-50%); }\n\n.popup-container-top .caret-up {\n  bottom: -25px;\n  transform: translateX(-50%) rotate(180deg); }\n\n.popup-background {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100vw;\n  height: 100vh;\n  pointer-events: all;\n  z-index: 1500;\n  background: rgba(0, 0, 0, 0.4);\n  transition: all 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955); }\n\n.ui-card-shadow {\n  z-index: 1501; }\n\n.ui-card-footer {\n  text-align: right; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYXdhbm1hY2Jvb2svRG9jdW1lbnRzL2Rzcy9jbGllbnQvc3JjL2FwcC9nZW8td2ViL3N0eWxlcy9mYWtlLWxlYWZsZXQtY29udHJvbC5zY3NzIiwiL1VzZXJzL3Bhd2FubWFjYm9vay9Eb2N1bWVudHMvZHNzL2NsaWVudC9zcmMvc3R5bGVzLnNjc3MiLCIvVXNlcnMvcGF3YW5tYWNib29rL0RvY3VtZW50cy9kc3MvY2xpZW50L3NyYy9hcHAvZ2VvLXdlYi9tYXAvbWFwLXBvcHVwL21hcC1wb3B1cC5jb21wb25lbnQuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztFQUdFLFdBQVc7RUFDWCxnQkFBZ0I7RUFDaEIsa0JBQWtCO0VBQ2xCLHdDQUF3QztFQUN4QyxZQUFZO0VBQ1osNEJBQTRCLEVBQUE7O0FBRzlCOzs7O0VBR0UseUJBQXlCO0VBQ3pCLDhDQUE4QztFQUM5QyxjQUFjLEVBQUE7O0FBR2hCOztFQUVFLG1CQUFtQjtFQUNuQixrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxZQUFZO0VBQ1osV0FBVyxFQUFBOztBQUdiO0VBQ0UsWUFBWTtFQUNaLFdBQVcsRUFBQTs7QUFHYjs7RUFFRSxjQUFjO0VBQ2QsWUFBWTtFQUNaLFdBQVc7RUFDWCxjQUFjO0VBQ2QsY0FBYyxFQUFBOztBQUdoQjs7RUFFRSx5QkFBeUIsRUFBQTs7QUFHM0I7O0VBRUUsV0FBVztFQUNYLGVBQWUsRUFBQTs7QUFHakI7O0VBRUUseUJBQXlCLEVBQUE7O0FBRzNCOzs7O0VBR0UsY0FBYyxFQUFBOztBQUdoQjs7RUFFRSxrQkFBa0I7RUFDbEIsUUFBUTtFQUNSLFNBQVM7RUFDVCxnQ0FBZ0MsRUFBQTs7QUFHbEM7RUFDRSxlQUFlLEVBQUE7O0FBR2pCO0VBQ0UsZUFBZSxFQUFBOztBQUVqQjtFQUNFLGtCQUFrQjtFQUNsQixRQUFRO0VBQ1IsU0FBUztFQUNULGdDQUFnQyxFQUFBOztBQ3JGbEM7RUFDRSxzQkFBc0IsRUFBQTs7QUFHeEI7O0VBRUUsOEVBQThFO0VBQzlFLGVBQWU7RUFDZixTQUFTO0VBQ1QsVUFBVSxFQUFBOztBQUdaO0VBQ0UsOEVBQThFO0VBQzlFLGVBQWUsRUFBQTs7QUFHakI7O0VBRUUsZUFBZTtFQUNmLGdCQUFnQixFQUFBOztBQUdsQjs7RUFFRSxlQUFlO0VBQ2YsZ0JBQWdCLEVBQUE7O0FBT2xCO0VBQ0Usc0JBQXNCO0VBQ3RCLGdCQUFnQjtFQUNoQixxQkFBcUI7RUFDckIsMEJBQTBCO0VBQzFCLHNCQUFzQjtFQUN0Qix3QkFBd0I7RUFDeEIscUJBQXFCLEVBQUE7O0FBR3ZCO0VBQ0UsZ0JBQWdCO0VBQ2hCLGtCQUFrQixFQUFBOztBQUdwQjtFQUNFLG1CQUFtQjtFQUNuQixnQkFBZ0I7RUFDaEIsdUJBQXVCLEVBQUE7O0FBR3pCOztFQUVFLGNBQWM7RUFDZCxtQkFBbUI7RUFDbkIsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0Usa0JBQWtCLEVBQUE7O0FBR3BCO0VBQ0UsbUJBQW1CLEVBQUE7O0FBR3JCO0VBQ0Usa0JBQWtCLEVBQUE7O0FBR3BCO0VBQ0UsaUJBQWlCO0VBQ2pCLGNBQWMsRUFBQTs7QUFHaEI7RUFDRSxvQ0FBb0M7RUFDcEMsMkJBQTJCLEVBQUE7O0FBRzdCO0VBQ0UsY0FBYyxFQUFBOztBQUdoQjtFQUNFLGdCQUFnQixFQUFBOztBQUdsQjtFQUNFLFdBQVc7RUFDWCxnQkFBZ0I7RUFDaEIsZUFBZTtFQUNmLGtCQUFBO0VBQ0Esa0JBQWtCLEVBQUE7O0FBR3BCO0VBQ0UsaUJBQWlCO0VBQ2pCLGdCQUFnQixFQUFBOztBQUdsQjtFQUNFLHNCQUFzQixFQUFBOztBQUd4QjtFQUNFLFlBQVksRUFBQTs7QUFJZDtFQUNFLG1CQUFtQixFQUFBOztBQUdyQjtFQUNFLCtCQUErQjtFQUMvQixpQkFBaUIsRUFBQTs7QUFHbkI7RUFDRSwrQkFBK0I7RUFDL0IsaUJBQWlCO0VBQ2pCLGdCQUFnQjtFQUNoQixtQkFBbUI7RUFFbkIsNENBQTRDO0VBRTVDLGlCQUFpQjtFQUNqQixrQkFBa0IsRUFBQTs7QUFHcEI7O0VBRUUsaUJBQWlCO0VBQ2pCLGtCQUFrQixFQUFBOztBQUdwQjtFQUNFLGdCQUFnQixFQUFBOztBQUdsQjtFQUNFLG1CQUFtQixFQUFBOztBQUdyQjtFQUNFLHFCQUFxQjtFQUNyQixXQUFXO0VBQ1gsWUFBWTtFQUNaLGVBQWU7RUFDZixtQkFBbUI7RUFDbkIsMkJBQTJCLEVBQUE7O0FBSTdCO0VBQ0UsZUFBZTtFQUNmLGlCQUFpQjtFQUNqQixjQUFjLEVBQUE7O0FBR2hCO0VBQ0UscUJBQXFCLEVBQUE7O0FBSXZCOzs7Ozs7RUFVRSw4RUFBOEUsRUFBQTs7QUFJaEY7OztFQUdFLGNBQWM7RUFDZCx5QkFBeUI7RUFDekIscUJBQXFCLEVBQUE7O0FBRXZCOzs7RUFLRSx5QkFBeUI7RUFDekIsY0FBYztFQUNkLHFCQUFxQixFQUFBOztBQUd2Qjs7O0VBT0UsK0JBQStCLEVBQUE7O0FBRWpDOzs7RUFLRSx5QkFBeUI7RUFDekIsY0FBYztFQUNkLHFCQUFxQixFQUFBOztBQUV2Qjs7O0VBR0UsY0FBYztFQUNkLHlCQUF5QjtFQUN6QixxQkFBcUIsRUFBQTs7QUFFdkI7OztFQUdFLHlCQUF5QjtFQUN6QixjQUFjO0VBQ2QscUJBQXFCLEVBQUE7O0FBRXZCOzs7RUFLRSwrQkFBK0IsRUFBQTs7QUFFakM7OztFQUdFLHlCQUF5QjtFQUN6QixjQUFjO0VBQ2QscUJBQXFCLEVBQUE7O0FBSXZCOzs7RUFHRSxjQUFjO0VBQ2QseUJBQXlCO0VBQ3pCLHFCQUFxQixFQUFBOztBQUV2Qjs7O0VBS0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFFdkI7OztFQU9FLCtCQUErQixFQUFBOztBQUVqQzs7O0VBS0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFJdkI7OztFQUdFLGNBQWM7RUFDZCxzQkFBc0I7RUFDdEIsa0JBQWtCLEVBQUE7O0FBRXBCOzs7RUFLRSxzQkFBc0I7RUFDdEIsY0FBYztFQUNkLGtCQUFrQixFQUFBOztBQUVwQjs7O0VBT0UsK0JBQStCLEVBQUE7O0FBRWpDOzs7RUFLRSxzQkFBc0I7RUFDdEIsY0FBYztFQUNkLGtCQUFrQixFQUFBOztBQUlwQjs7O0VBR0UsY0FBYztFQUNkLHlCQUF5QjtFQUN6QixxQkFBcUIsRUFBQTs7QUFFdkI7OztFQUtFLHlCQUF5QjtFQUN6QixjQUFjO0VBQ2QscUJBQXFCLEVBQUE7O0FBRXZCOzs7RUFPRSwrQkFBK0IsRUFBQTs7QUFFakM7OztFQUtFLHlCQUF5QjtFQUN6QixjQUFjO0VBQ2QscUJBQXFCLEVBQUE7O0FBSXZCOzs7RUFHRSxjQUFjO0VBQ2QseUJBQXlCO0VBQ3pCLHFCQUFxQixFQUFBOztBQUV2Qjs7O0VBS0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFFdkI7OztFQU9FLCtCQUErQixFQUFBOztBQUVqQzs7O0VBS0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFJdkI7OztFQUdFLGNBQWM7RUFDZCxzQkFBc0I7RUFDdEIsa0JBQWtCLEVBQUE7O0FBR3BCOztFQUVFLHFCQUFxQixFQUFBOztBQUd2Qjs7O0VBS0Usc0JBQXNCO0VBQ3RCLGNBQWM7RUFDZCxrQkFBa0IsRUFBQTs7QUFHcEI7O0VBSUUscUJBQXFCLEVBQUE7O0FBR3ZCOzs7RUFPRSwrQkFBK0IsRUFBQTs7QUFFakM7OztFQUtFLHNCQUFzQjtFQUN0QixjQUFjO0VBQ2Qsa0JBQWtCLEVBQUE7O0FBR3BCOztFQUlFLHFCQUFxQixFQUFBOztBQU12Qjs7RUFFRSw4QkFBOEIsRUFBQTs7QUFHaEM7RUFDRSxtREFBbUQsRUFBQTs7QUE3VHJEO0VBaVVFLDBCQUEwQixFQUFBOztBQTdUNUI7RUFpVUUsMEJBQTBCLEVBQUE7O0FBSTVCO0VBQ0UsWUFBWTtFQUNaLGdCQUFnQjtFQUNoQixVQUFVO0VBQ1YsY0FBYztFQUNkLFdBQVc7RUFFWCxpQkFBaUI7RUFHakIsY0FBYyxFQUFBOztBQUloQjtFQUNFLHdCQUF1QjtVQUF2Qix1QkFBdUIsRUFBQTs7QUFJekI7O0VBRUUscUJBQXFCLEVBQUE7O0FBSXZCOztFQUVFLDJCQUEyQixFQUFBOztBQUc3Qjs7Ozs7Ozs7Ozs7Ozs7RUFjRSwrQkFBK0IsRUFBQTs7QUFJakM7RUFDRSxxREFBcUQsRUFBQTs7QUFHdkQ7RUFDRSw2QkFBNkI7RUFDN0Isa0JBQWtCLEVBQUE7O0FBR3BCOzs7RUFhRSxnQkFBZ0IsRUFBQTs7QUFJbEI7RUFDRSxXQUFXLEVBQUE7O0FBR2I7O0VBRUUsbUJBQW1CLEVBQUE7O0FBS3JCO0VBQ0UsbUJBQW1CLEVBQUE7O0FBR3JCOztFQUVFLFdBQVcsRUFBQTs7QUFJYjtFQUNFLHdCQUF3QixFQUFBOztBQUkxQjtFQUNFLGNBQWMsRUFBQTs7QUFEaEI7RUFLRSxlQUFlLEVBQUE7O0FBR2pCO0VBQ0UsbUJBQW1CO0VBQ25CLGVBQWUsRUFBQTs7QUFHakI7RUFDRSxlQUFlLEVBQUE7O0FBTWpCLFVBQUE7O0FBQ0E7RUFDRSxXQUFXLEVBQUE7O0FBR2IsVUFBQTs7QUFDQTtFQUNFLGdCQUFnQixFQUFBOztBQUdsQixXQUFBOztBQUNBO0VBQ0UscUJBQXFCO0VBQ3JCLGtDQUFrQztFQUNsQyw0QkFBNEI7RUFDNUIsa0JBQWtCLEVBQUE7O0FBR3BCLG9CQUFBOztBQUNBO0VBQ0UscUJBQXFCO0VBQ3JCLDRCQUE0QixFQUFBOztBQy9sQjlCO0VBQ0UsYUFBYTtFQUNiLGtCQUFrQjtFQUNsQixRQUFRO0VBQ1IsT0FBTztFQUNQLDJCQUEyQjtFQUMzQixZQUFZLEVBQUE7O0FBR2Q7RUFDRSxpQ0FBaUMsRUFBQTs7QUFPbkM7RUFDRSxnQkFBZ0IsRUFBQTs7QUFHbEI7RUFDRSxZQUFZO0VBQ1osZUFBZTtFQUNmLGtCQUFrQjtFQUNsQixTQUFTO0VBQ1QsNERBQW9EO1VBQXBELG9EQUFvRCxFQUFBOztBQUd0RDtFQUNFLFVBQVU7RUFDViwyQkFBMkIsRUFBQTs7QUFHN0I7RUFDRSxhQUFhO0VBQ2IsMENBQTBDLEVBQUE7O0FBTzVDO0VBQ0Usa0JBQWtCO0VBQ2xCLE1BQU07RUFDTixPQUFPO0VBQ1AsWUFBWTtFQUNaLGFBQWE7RUFDYixtQkFBbUI7RUFDbkIsYUFBYTtFQUNiLDhCQUE4QjtFQUM5Qiw0REFBNEQsRUFBQTs7QUFHOUQ7RUFDRSxhQUFhLEVBQUE7O0FBR2Y7RUFDRSxpQkFBaUIsRUFBQSIsImZpbGUiOiJzcmMvYXBwL2dlby13ZWIvbWFwL21hcC1wb3B1cC9tYXAtcG9wdXAuY29tcG9uZW50LnNjc3MiLCJzb3VyY2VzQ29udGVudCI6WyIuZmFrZS1sZWFmbGV0LWNvbnRyb2wsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtY29sb3VycyB7XG4gIGNvbG9yOiAjMzMzO1xuICBiYWNrZ3JvdW5kOiAjZmZmO1xuICBib3JkZXItcmFkaXVzOiA0cHg7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDJweCByZ2JhKDAsIDAsIDAsIDAuMSk7XG4gIGJvcmRlcjogbm9uZTtcbiAgYmFja2dyb3VuZC1jbGlwOiBwYWRkaW5nLWJveDtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLmFjdGl2ZSxcbi5mYWtlLWxlYWZsZXQtY29udHJvbC1sZy5hY3RpdmUsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtY29sb3Vycy5hY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3YWQ5O1xuICBib3gtc2hhZG93OiAwIDAgMCAycHggcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICBjb2xvcjogI2ZmZmZmZjtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIHtcbiAgbWFyZ2luLWJvdHRvbTogMTBweDtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wge1xuICBoZWlnaHQ6IDMwcHg7XG4gIHdpZHRoOiAzMHB4O1xufVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcge1xuICBoZWlnaHQ6IDQ0cHg7XG4gIHdpZHRoOiA0NHB4O1xufVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wgYSxcbi5mYWtlLWxlYWZsZXQtY29udHJvbC1sZyBhIHtcbiAgY29sb3I6IGluaGVyaXQ7XG4gIGhlaWdodDogMTAwJTtcbiAgd2lkdGg6IDEwMCU7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBsaW5lLWhlaWdodDogMDtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sOmhvdmVyLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2Y0ZjRmNDtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sIGE6aG92ZXIsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcgYTpob3ZlciB7XG4gIGNvbG9yOiAjMzMzO1xuICBjdXJzb3I6IHBvaW50ZXI7XG59XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbC5hY3RpdmU6aG92ZXIsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcuYWN0aXZlOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzE3NzViZDtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLmFjdGl2ZSBhOmhvdmVyLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnLmFjdGl2ZSBhOmhvdmVyLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWNvbG91cnMuYWN0aXZlIGE6aG92ZXIge1xuICBjb2xvcjogI2ZmZmZmZjtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sIGZhLWljb24ubmctZmEtaWNvbixcbi5mYWtlLWxlYWZsZXQtY29udHJvbC1sZyBmYS1pY29uLm5nLWZhLWljb24ge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogNTAlO1xuICBsZWZ0OiA1MCU7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpO1xufVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wgYSB7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIGEge1xuICBmb250LXNpemU6IDI0cHg7XG59XG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcgc3BhbiB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgdG9wOiA1MCU7XG4gIGxlZnQ6IDUwJTtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7XG59XG4iLCIqIHtcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbn1cblxuYm9keSxcbmh0bWwge1xuICBmb250LWZhbWlseTogUm9ib3RvLCBcIkhlbHZldGljYSBOZXVlXCIsIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWYgIWltcG9ydGFudDtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBtYXJnaW46IDA7XG4gIHBhZGRpbmc6IDA7XG59XG5cbi5jMyB0ZXh0IHtcbiAgZm9udC1mYW1pbHk6IFJvYm90bywgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmICFpbXBvcnRhbnQ7XG4gIGZvbnQtc2l6ZTogMTRweDtcbn1cblxuaDEsXG4uaDEge1xuICBmb250LXNpemU6IDI0cHg7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG59XG5cbmgyLFxuLmgyIHtcbiAgZm9udC1zaXplOiAxOHB4O1xuICBmb250LXdlaWdodDogNTAwO1xufVxuXG5oMyxcbi5oMyB7XG59XG5cbnByZSB7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7XG4gIG92ZXJmbG93LXg6IGF1dG87XG4gIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbiAgd2hpdGUtc3BhY2U6IC1tb3otcHJlLXdyYXA7XG4gIHdoaXRlLXNwYWNlOiAtcHJlLXdyYXA7XG4gIHdoaXRlLXNwYWNlOiAtby1wcmUtd3JhcDtcbiAgd29yZC13cmFwOiBicmVhay13b3JkO1xufVxuXG4uZm9udC1pdGFsaWMtbGlnaHQge1xuICBmb250LXdlaWdodDogMTAwO1xuICBmb250LXN0eWxlOiBpdGFsaWM7XG59XG5cbi50ZXh0LW92ZXJmbG93LWVsbGlwc2lzIHtcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG59XG5cbi5sYWJlbCxcbmxhYmVsIHtcbiAgZGlzcGxheTogYmxvY2s7XG4gIG1hcmdpbi1ib3R0b206IDEwcHg7XG4gIG1hcmdpbi10b3A6IDIwcHg7XG59XG5cbi5iYWRnZSA+IC5waSB7XG4gIHBhZGRpbmctcmlnaHQ6IDRweDtcbn1cblxuYS5pY29uLWxpbms6bGFzdC1vZi10eXBlIHtcbiAgcGFkZGluZy1yaWdodDogMTBweDtcbn1cblxuYS5pY29uLWxpbms6Zmlyc3Qtb2YtdHlwZSB7XG4gIHBhZGRpbmctbGVmdDogMTBweDtcbn1cblxuYS5pY29uLWxpbmsge1xuICBmb250LXNpemU6IDAuODVlbTtcbiAgcGFkZGluZzogMCA1cHg7XG59XG5cbmJvZHkgLnVpLXdpZGdldC1vdmVybGF5IHtcbiAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAwLCAwLCAwLjIpO1xuICB0cmFuc2l0aW9uOiBhbGwgbGluZWFyIDAuMnM7XG59XG5cbi51aS1zdGF0ZS1oaWdobGlnaHQgYS5pY29uLWxpbmsge1xuICBjb2xvcjogI2ZmZmZmZjtcbn1cblxuLnVpLXN0YXRlLWhpZ2hsaWdodCBhLmljb24tbGluazpob3ZlciB7XG4gIGNvbG9yOiAjZmZmZmZmYmE7XG59XG5cbi5lbXB0eS1wbGFjZWhvbGRlciB7XG4gIGNvbG9yOiAjOTk5O1xuICBmb250LXdlaWdodDogMTAwO1xuICBwYWRkaW5nOiAyMHB4IDA7XG4gIC8qIGhlaWdodDogMTAwJTsgKi9cbiAgdGV4dC1hbGlnbjogY2VudGVyO1xufVxuXG4udWktdG9hc3Qge1xuICBtYXgtaGVpZ2h0OiAxMDB2aDtcbiAgb3ZlcmZsb3cteTogYXV0bztcbn1cblxuLnVpLXRvYXN0LWRldGFpbCB7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7XG59XG5cbi5tb2RhbC1kaWFsb2cudWktZGlhbG9nIHtcbiAgd2lkdGg6IDQwMHB4O1xufVxuXG4vLyBBZGQgYm90dG9tIG1hcmdpbiB0byByb3dzIGluIGRpYWxvZ3Ncbi51aS1kaWFsb2cgLnVpLWdyaWQgLnVpLWdyaWQtcm93IHtcbiAgbWFyZ2luLWJvdHRvbTogMTBweDtcbn1cblxuLnVpLWRpYWxvZyAudWktbGlzdGJveCAudWktbGlzdGJveC1saXN0LXdyYXBwZXIge1xuICBtYXgtaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNDAwcHgpO1xuICBtaW4taGVpZ2h0OiAxMDBweDtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctY29udGVudCB7XG4gIG1heC1oZWlnaHQ6IGNhbGMoMTAwdmggLSAyMDBweCk7XG4gIG1pbi1oZWlnaHQ6IDIwMHB4O1xuICBvdmVyZmxvdy15OiBhdXRvO1xuICBvdmVyZmxvdy15OiBvdmVybGF5O1xuXG4gIC1tcy1vdmVyZmxvdy1zdHlsZTogLW1zLWF1dG9oaWRpbmctc2Nyb2xsYmFyO1xuXG4gIGJvcmRlci1sZWZ0OiBub25lO1xuICBib3JkZXItcmlnaHQ6IG5vbmU7XG59XG5cbmJvZHkgLnVpLWRpYWxvZyAudWktZGlhbG9nLXRpdGxlYmFyLFxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctZm9vdGVyIHtcbiAgYm9yZGVyLWxlZnQ6IG5vbmU7XG4gIGJvcmRlci1yaWdodDogbm9uZTtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXIge1xuICBib3JkZXItdG9wOiBub25lO1xufVxuXG5ib2R5IC51aS1kaWFsb2cgLnVpLWRpYWxvZy1mb290ZXIge1xuICBib3JkZXItYm90dG9tOiBub25lO1xufVxuXG4udWktZGlhbG9nIC51aS1saXN0Ym94IC51aS1wcm9ncmVzc2JhciB7XG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTRweDtcbiAgbWFyZ2luLXRvcDogM3B4O1xuICBtYXJnaW4tYm90dG9tOiAtM3B4O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwMDAwNGE7XG59XG5cbi8vIFByb2dyZXNzIGJhciBpbiBsaXN0Ym94IGluIGRpYWxvZ3Ncbi51aS1kaWFsb2cgLnVpLWxpc3Rib3ggLnVpLXByb2dyZXNzYmFyIC51aS1wcm9ncmVzc2Jhci1sYWJlbCB7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgbGluZS1oZWlnaHQ6IDEuMjU7XG4gIGNvbG9yOiBpbmhlcml0O1xufVxuXG4udWktZGlhbG9nIC51aS1saXN0Ym94IC51aS1wcm9ncmVzc2JhciAudWktcHJvZ3Jlc3NiYXItdmFsdWUge1xuICBiYWNrZ3JvdW5kOiAjMDAwMDAwNmI7XG59XG5cbi8vIE92ZXJ3cml0ZSBQcmltZU5HIGZvbnRzXG5ib2R5IC51aS13aWRnZXQsXG5ib2R5XG4gIC51aS1hdXRvY29tcGxldGUudWktYXV0b2NvbXBsZXRlLW11bHRpcGxlXG4gIC51aS1hdXRvY29tcGxldGUtbXVsdGlwbGUtY29udGFpbmVyXG4gIC51aS1hdXRvY29tcGxldGUtaW5wdXQtdG9rZW5cbiAgaW5wdXQsXG5ib2R5IC51aS1jaGlwcyA+IHVsLnVpLWlucHV0dGV4dCAudWktY2hpcHMtaW5wdXQtdG9rZW4gaW5wdXQsXG5ib2R5IC51aS10YWJsZSAudWktZWRpdGFibGUtY29sdW1uIGlucHV0LFxuYm9keSAudWktdHJlZXRhYmxlIC51aS1lZGl0YWJsZS1jb2x1bW4gaW5wdXQsXG5ib2R5IC51aS10ZXJtaW5hbCAudWktdGVybWluYWwtaW5wdXQge1xuICBmb250LWZhbWlseTogUm9ib3RvLCBcIkhlbHZldGljYSBOZXVlXCIsIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWYgIWltcG9ydGFudDtcbn1cblxuLy8gT3ZlcndyaXRlIFByaW1lTmcgY29sb3Vyc1xuYm9keSAuc2Vjb25kYXJ5LWNvbCxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zZWNvbmRhcnksXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLXNlY29uZGFyeSA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdCB7XG4gIGNvbG9yOiAjMzMzMzMzO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZThlOGU4O1xuICBib3JkZXItY29sb3I6ICNlOGU4ZTg7XG59XG5ib2R5IC5zZWNvbmRhcnktY29sOmhvdmVyLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXNlY29uZGFyeTplbmFibGVkOmhvdmVyLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zZWNvbmRhcnlcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNjOGM4Yzg7XG4gIGNvbG9yOiAjMzMzMzMzO1xuICBib3JkZXItY29sb3I6ICNjOGM4Yzg7XG59XG4vLyBDb2xvdXJzIGZyb20gUHJpbWVOR1xuYm9keSAuc2Vjb25kYXJ5LWNvbDplbmFibGVkOmZvY3VzLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXNlY29uZGFyeTplbmFibGVkOmZvY3VzLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zZWNvbmRhcnlcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpmb2N1cyB7XG4gIC13ZWJraXQtYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gIzhkY2RmZjtcbiAgLW1vei1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjOGRjZGZmO1xuICBib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjOGRjZGZmO1xufVxuYm9keSAuc2Vjb25kYXJ5LWNvbDphY3RpdmUsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc2Vjb25kYXJ5OmVuYWJsZWQ6YWN0aXZlLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zZWNvbmRhcnlcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjYTBhMGEwO1xuICBjb2xvcjogIzMzMzMzMztcbiAgYm9yZGVyLWNvbG9yOiAjYTBhMGEwO1xufVxuYm9keSAuZGVmYXVsdC1jb2wsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24taW5mbyxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24taW5mbyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdCB7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3YWQ5O1xuICBib3JkZXItY29sb3I6ICMwMDdhZDk7XG59XG5ib2R5IC5kZWZhdWx0LWNvbDpob3ZlcixcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1pbmZvOmVuYWJsZWQ6aG92ZXIsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWluZm8gPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICMxMTZmYmY7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBib3JkZXItY29sb3I6ICMxMTZmYmY7XG59XG5ib2R5IC5kZWZhdWx0LWNvbDplbmFibGVkOmZvY3VzLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWluZm86ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24taW5mbyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjOGRjZGZmO1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICM4ZGNkZmY7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICM4ZGNkZmY7XG59XG5ib2R5IC5kZWZhdWx0LWNvbDphY3RpdmUsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24taW5mbzplbmFibGVkOmFjdGl2ZSxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24taW5mbyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmFjdGl2ZSB7XG4gIGJhY2tncm91bmQtY29sb3I6ICMwMDViOWY7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBib3JkZXItY29sb3I6ICMwMDViOWY7XG59XG5cbi8vIFNVY2Nlc3MgY29sXG5ib2R5IC5zdWNjZXNzLWNvbCxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zdWNjZXNzLFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zdWNjZXNzID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0IHtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJhY2tncm91bmQtY29sb3I6ICMzNGE4MzU7XG4gIGJvcmRlci1jb2xvcjogIzM0YTgzNTtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sOmhvdmVyLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3M6ZW5hYmxlZDpob3ZlcixcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2Vzc1xuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzEwN2QxMTtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogIzEwN2QxMTtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc3VjY2VzczplbmFibGVkOmZvY3VzLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zdWNjZXNzXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6Zm9jdXMge1xuICAtd2Via2l0LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNhYWU1YWE7XG4gIC1tb3otYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2FhZTVhYTtcbiAgYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2FhZTVhYTtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sOmFjdGl2ZSxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zdWNjZXNzOmVuYWJsZWQ6YWN0aXZlLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zdWNjZXNzXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6YWN0aXZlIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzBjNmIwZDtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogIzBjNmIwZDtcbn1cblxuLy8gU1VjY2VzcyBvdXRsaW5lXG5ib2R5IC5zdWNjZXNzLWNvbC1vdXRsaW5lLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZSxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0IHtcbiAgY29sb3I6ICMzNGE4MzU7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGJvcmRlci1jb2xvcjogI2ZmZjtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sLW91dGxpbmU6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lOmVuYWJsZWQ6aG92ZXIsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZVxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgY29sb3I6ICMxMDdkMTE7XG4gIGJvcmRlci1jb2xvcjogI2ZmZjtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sLW91dGxpbmU6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zdWNjZXNzLW91dGxpbmU6ZW5hYmxlZDpmb2N1cyxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6Zm9jdXMge1xuICAtd2Via2l0LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNhYWU1YWE7XG4gIC1tb3otYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2FhZTVhYTtcbiAgYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2FhZTVhYTtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sLW91dGxpbmU6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZTplbmFibGVkOmFjdGl2ZSxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6YWN0aXZlIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgY29sb3I6ICMwYzZiMGQ7XG4gIGJvcmRlci1jb2xvcjogI2ZmZjtcbn1cblxuLy8gV2FybmluZyBjb2xcbmJvZHkgLndhcm5pbmctY29sLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXdhcm5pbmcsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLXdhcm5pbmcgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogIzMzMzMzMztcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmYmEwMTtcbiAgYm9yZGVyLWNvbG9yOiAjZmZiYTAxO1xufVxuYm9keSAud2FybmluZy1jb2w6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24td2FybmluZzplbmFibGVkOmhvdmVyLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi13YXJuaW5nXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZWQ5OTBiO1xuICBjb2xvcjogIzMzMzMzMztcbiAgYm9yZGVyLWNvbG9yOiAjZWQ5OTBiO1xufVxuYm9keSAud2FybmluZy1jb2w6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi13YXJuaW5nOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLXdhcm5pbmdcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpmb2N1cyB7XG4gIC13ZWJraXQtYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2ZmZWFiNDtcbiAgLW1vei1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZmZlYWI0O1xuICBib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZmZlYWI0O1xufVxuYm9keSAud2FybmluZy1jb2w6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXdhcm5pbmc6ZW5hYmxlZDphY3RpdmUsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLXdhcm5pbmdcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZDM4YjEwO1xuICBjb2xvcjogIzMzMzMzMztcbiAgYm9yZGVyLWNvbG9yOiAjZDM4YjEwO1xufVxuXG4vLyBEYW5nZXIgY29sb3VyXG5ib2R5IC5kYW5nZXItY29sLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlcixcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0IHtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJhY2tncm91bmQtY29sb3I6ICNlOTEyMjQ7XG4gIGJvcmRlci1jb2xvcjogI2U5MTIyNDtcbn1cbmJvZHkgLmRhbmdlci1jb2w6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyOmVuYWJsZWQ6aG92ZXIsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlclxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2MwMTEyMDtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogI2MwMTEyMDtcbn1cbmJvZHkgLmRhbmdlci1jb2w6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXI6ZW5hYmxlZDpmb2N1cyxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6Zm9jdXMge1xuICAtd2Via2l0LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7XG4gIC1tb3otYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2Y5YjRiYTtcbiAgYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2Y5YjRiYTtcbn1cbmJvZHkgLmRhbmdlci1jb2w6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlcjplbmFibGVkOmFjdGl2ZSxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6YWN0aXZlIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2E5MDAwMDtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogI2E5MDAwMDtcbn1cblxuLy8gRGFuZ2VyIG91dGxpbmVcbmJvZHkgLmRhbmdlci1jb2wtb3V0bGluZSxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZSxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmUgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogI2U5MTIyNDtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgYm9yZGVyLWNvbG9yOiAjZmZmO1xufVxuXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmUsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0IHtcbiAgYm9yZGVyLWNvbG9yOiAjZTkxMjI0O1xufVxuXG5ib2R5IC5kYW5nZXItY29sLW91dGxpbmU6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmU6ZW5hYmxlZDpob3ZlcixcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmVcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGNvbG9yOiAjYzAxMTIwO1xuICBib3JkZXItY29sb3I6ICNmZmY7XG59XG5cbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZTplbmFibGVkOmhvdmVyLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZVxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYm9yZGVyLWNvbG9yOiAjYzAxMTIwO1xufVxuXG5ib2R5IC5kYW5nZXItY29sLW91dGxpbmU6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZTplbmFibGVkOmZvY3VzLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZVxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZjliNGJhO1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7XG59XG5ib2R5IC5kYW5nZXItY29sLW91dGxpbmU6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lOmVuYWJsZWQ6YWN0aXZlLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZVxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmFjdGl2ZSB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGNvbG9yOiAjYTkwMDAwO1xuICBib3JkZXItY29sb3I6ICNmZmY7XG59XG5cbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZTplbmFibGVkOmFjdGl2ZSxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmVcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBib3JkZXItY29sb3I6ICNhOTAwMDA7XG59XG5cbi8vIE92ZXJyaWRpbmcgb3RoZXIgUHJpbWVORyBzdHlsZXNcblxuLy8gTW92aW5nIG1hcmdpbiB0byBsZWZ0IHNpZGUgLSBmcm9tIHJpZ2h0IGZvciBidXR0b25zIGluIGRpYWxvZy9jYXJkIGZvb3RlcnNcbmJvZHkgLnVpLWRpYWxvZyAudWktZGlhbG9nLWZvb3RlciBidXR0b24sXG5ib2R5IC51aS1jYXJkIC51aS1jYXJkLWZvb3RlciBidXR0b24ge1xuICBtYXJnaW46IDAgMCAwIDAuNWVtICFpbXBvcnRhbnQ7XG59XG5cbmJvZHkgLnVpLWRpYWxvZyB7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDJweCByZ2JhKDAsIDAsIDAsIDAuMSkgIWltcG9ydGFudDtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXIge1xuICBib3JkZXItcmFkaXVzOiA0cHggNHB4IDAgMDtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctZm9vdGVyIHtcbiAgYm9yZGVyLXJhZGl1czogMCAwIDRweCA0cHg7XG59XG5cbi8vIE1ha2UgdWkgZXJyb3IgbWVzc2FnZXMgbW9yZSBhdHRyYWN0aXZlXG5ib2R5IC51aS1tZXNzYWdlcy1lcnJvciB7XG4gIGJvcmRlcjogbm9uZTtcbiAgZm9udC13ZWlnaHQ6IDgwMDtcbiAgcGFkZGluZzogMDtcbiAgZGlzcGxheTogYmxvY2s7XG4gIHdpZHRoOiAxMDAlO1xuXG4gIHRleHQtYWxpZ246IHJpZ2h0O1xuXG4gIC8vIEZyb20gLnVpLWlucHV0dGV4dC5uZy1kaXJ0eS5uZy1pbnZhbGlkXG4gIGNvbG9yOiAjYTgwMDAwO1xufVxuXG4vLyBSZW1vdmUgbGVmdCBwYWRkaW5nIGZyb20gZXJyb3IgbWVzc2FnZXMgVUxcbmJvZHkgLm5nLWRpcnR5Lm5nLWludmFsaWQgKyB1bCB7XG4gIHBhZGRpbmctaW5saW5lLXN0YXJ0OiAwO1xufVxuXG4vLyBNYWtlIGludmFsaWQgaW5wdXQgYm9yZGVyIHJlZCAtIGV2ZW4gd2hlbiBmb2N1c3NlZFxuYm9keSAudWktaW5wdXR0ZXh0Lm5nLWludmFsaWQ6ZW5hYmxlZDpmb2N1cyxcbi51aS1pbnB1dHRleHQge1xuICBib3JkZXItY29sb3I6ICNhODAwMDA7XG59XG5cbi8vIEFkZCBsaWdodCByZWQgb3V0bGluZSB0byBpbnZhbGlkIHRleHQgaW5wdXRzXG5ib2R5IC51aS1pbnB1dHRleHQsXG5ib2R5IC51aS1pbnB1dGdyb3VwIC51aS1pbnB1dHRleHQubmctZGlydHkubmctaW52YWxpZCArIC51aS1pbnB1dGdyb3VwLWFkZG9uIHtcbiAgdHJhbnNpdGlvbjogYm94LXNoYWRvdyAwLjJzO1xufVxuXG5ib2R5IC51aS1pbnB1dHRleHQubmctZGlydHkubmctaW52YWxpZCxcbmJvZHkgcC1kcm9wZG93bi5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLWRyb3Bkb3duLFxuYm9keSBwLWF1dG9jb21wbGV0ZS5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLWF1dG9jb21wbGV0ZSA+IC51aS1pbnB1dHRleHQsXG5ib2R5IHAtY2FsZW5kYXIubmctZGlydHkubmctaW52YWxpZCA+IC51aS1jYWxlbmRhciA+IC51aS1pbnB1dHRleHQsXG5ib2R5IHAtY2hpcHMubmctZGlydHkubmctaW52YWxpZCA+IC51aS1pbnB1dHRleHQsXG5ib2R5IHAtaW5wdXRtYXNrLm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktaW5wdXR0ZXh0LFxuYm9keSBwLWNoZWNrYm94Lm5nLWRpcnR5Lm5nLWludmFsaWQgLnVpLWNoa2JveC1ib3gsXG5ib2R5IHAtcmFkaW9idXR0b24ubmctZGlydHkubmctaW52YWxpZCAudWktcmFkaW9idXR0b24tYm94LFxuYm9keSBwLWlucHV0c3dpdGNoLm5nLWRpcnR5Lm5nLWludmFsaWQgLnVpLWlucHV0c3dpdGNoLFxuYm9keSBwLWxpc3Rib3gubmctZGlydHkubmctaW52YWxpZCAudWktaW5wdXR0ZXh0LFxuYm9keSBwLW11bHRpc2VsZWN0Lm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktbXVsdGlzZWxlY3QsXG5ib2R5IHAtc3Bpbm5lci5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLWlucHV0dGV4dCxcbmJvZHkgcC1zZWxlY3RidXR0b24ubmctZGlydHkubmctaW52YWxpZCAudWktYnV0dG9uLFxuYm9keSBwLXRvZ2dsZWJ1dHRvbi5uZy1kaXJ0eS5uZy1pbnZhbGlkIC51aS1idXR0b24ge1xuICBib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZjliNGJhO1xufVxuXG4vLyBFeHRlbmQgdGV4dC1maWVsZCByZWQgb3V0bGluZSB0byBhZGphY2VudCBsYWJlbHMgYW5kIGJ1dHRvbnNcbmJvZHkgLnVpLWlucHV0Z3JvdXAgLnVpLWlucHV0dGV4dC5uZy1kaXJ0eS5uZy1pbnZhbGlkICsgLnVpLWlucHV0Z3JvdXAtYWRkb24ge1xuICBib3gtc2hhZG93OiAycHggLTIuOHB4IDAgI2Y5YjRiYSwgMnB4IDIuOHB4IDAgI2Y5YjRiYTtcbn1cblxuYm9keSBwLWNhbGVuZGFyLm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktY2FsZW5kYXIudWktY2FsZW5kYXItdy1idG4ge1xuICBib3gtc2hhZG93OiAwIDAgMCAzcHggI2Y5YjRiYTtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xufVxuXG5ib2R5XG4gIC51aS1pbnB1dGdyb3VwXG4gIC51aS1pbnB1dHRleHQ6ZW5hYmxlZDpmb2N1czpub3QoLnVpLXN0YXRlLWVycm9yKVxuICArIC51aS1pbnB1dGdyb3VwLWFkZG9uLFxuYm9keVxuICBwLWNhbGVuZGFyLm5nLWRpcnR5Lm5nLWludmFsaWRcbiAgPiAudWktY2FsZW5kYXJcbiAgPiAudWktaW5wdXR0ZXh0OmVuYWJsZWQ6Zm9jdXM6bm90KC51aS1zdGF0ZS1lcnJvciksXG5ib2R5XG4gIHAtY2FsZW5kYXIubmctZGlydHkubmctaW52YWxpZFxuICA+IC51aS1jYWxlbmRhclxuICA+IC51aS1pbnB1dHRleHQ6ZW5hYmxlZDpmb2N1czpub3QoLnVpLXN0YXRlLWVycm9yKVxuICArIC51aS1jYWxlbmRhci1idXR0b24ge1xuICBib3gtc2hhZG93OiBub25lO1xufVxuXG4vLyBGb3JjZSAxMDAlIHdpZHRoIG9uIHVpLXRleHQtaW5wdXRzXG4qOm5vdCgudWktY2FsZW5kYXIpIC51aS1pbnB1dHRleHQge1xuICB3aWR0aDogMTAwJTtcbn1cblxuYm9keSAudWktc3RhdGUtZGlzYWJsZWQsXG5ib2R5IC51aS13aWRnZXQ6ZGlzYWJsZWQge1xuICBjdXJzb3I6IG5vdC1hbGxvd2VkO1xufVxuXG4vLyBTdHlsZXMgZm9yIEZvcm1zXG5cbi5mb3JtIGR5bmFtaWMtcHJpbWVuZy1mb3JtLWNvbnRyb2wgPiBkaXYge1xuICBtYXJnaW4tYm90dG9tOiAxMHB4O1xufVxuXG4uZm9ybSAudWktY2FsZW5kYXIsXG4uZm9ybSAudWktc3Bpbm5lciB7XG4gIHdpZHRoOiAxMDAlO1xufVxuXG4vLyBNYWtlIHByaW1lbmcgY2FsZW5kYXIgaW5wdXQgdGV4dGJveGVzIHRoZSBmdWxsIHdpZHRoIG9mIHRoZSBwb3B1cFxuLmZvcm0gLnVpLWNhbGVuZGFyLXctYnRuIGlucHV0LnVpLWlucHV0dGV4dCB7XG4gIHdpZHRoOiBjYWxjKDEwMCUgLSAzM3B4KTtcbn1cblxuLy8gTWFrZSBEYXRlcGlja2VyIGluIHBvcHVwcyBhIGJpdCBzbWFsbGVyXG4uZm9ybSAudWktZGF0ZXBpY2tlciB7XG4gIHBhZGRpbmc6IDAuNWVtO1xufVxuXG4uZm9ybSAudWktZGF0ZXBpY2tlciB7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cblxuLmZvcm0gLnVpLWRhdGVwaWNrZXIgLnVpLXRpbWVwaWNrZXIge1xuICBwYWRkaW5nOiAxMHB4IDAgMCAwO1xuICBmb250LXNpemU6IDExcHg7XG59XG5cbi5mb3JtIC51aS1kYXRlcGlja2VyIHRhYmxlIHtcbiAgZm9udC1zaXplOiAxMXB4O1xufVxuXG4vLyBTY3JvbGxiYXIgc3R5bGVcblxuLy8gU2Nyb2xsYmFyIGFkYXB0ZWQgZnJvbSBodHRwczovL3d3dy53M3NjaG9vbHMuY29tL2hvd3RvL2hvd3RvX2Nzc19jdXN0b21fc2Nyb2xsYmFyLmFzcFxuLyogd2lkdGggKi9cbjo6LXdlYmtpdC1zY3JvbGxiYXIge1xuICB3aWR0aDogMTBweDtcbn1cblxuLyogVHJhY2sgKi9cbjo6LXdlYmtpdC1zY3JvbGxiYXItdHJhY2sge1xuICBiYWNrZ3JvdW5kOiBub25lO1xufVxuXG4vKiBIYW5kbGUgKi9cbjo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWIge1xuICBiYWNrZ3JvdW5kOiAjMDAwMDAwMzM7XG4gIGJvcmRlcjogMnB4IHNvbGlkIHJnYmEoMCwgMCwgMCwgMCk7XG4gIGJhY2tncm91bmQtY2xpcDogcGFkZGluZy1ib3g7XG4gIGJvcmRlci1yYWRpdXM6IDVweDtcbn1cblxuLyogSGFuZGxlIG9uIGhvdmVyICovXG46Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1iOmhvdmVyIHtcbiAgYmFja2dyb3VuZDogIzAwMDAwMDU1O1xuICBiYWNrZ3JvdW5kLWNsaXA6IHBhZGRpbmctYm94O1xufVxuIiwiQGltcG9ydCBcIi4vLi4vLi4vc3R5bGVzL2Zha2UtbGVhZmxldC1jb250cm9sLnNjc3NcIjtcbkBpbXBvcnQgXCIuLi8uLi8uLi8uLi9zdHlsZXMuc2Nzc1wiO1xuXG4ucG9wdXAtY29udGFpbmVyIHtcbiAgei1pbmRleDogMTUwMjtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDVweDtcbiAgbGVmdDogMDtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpO1xuICB3aWR0aDogMzAwcHg7XG59XG5cbi5wb3B1cC1jb250YWluZXItdG9wIHtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTEwMCUpO1xufVxuXG4ucG9wdXAtY29udGFpbmVyIC51aS1jYXJkIHtcbiAgQGV4dGVuZCAuZmFrZS1sZWFmbGV0LWNvbnRyb2wtY29sb3Vycztcbn1cblxuLnBvcHVwLWNvbnRhaW5lci5iYWNrZ3JvdW5kIC51aS1jYXJkIHtcbiAgYm94LXNoYWRvdzogbm9uZTtcbn1cblxuLnBvcHVwLWNvbnRhaW5lciAuY2FyZXQtdXAge1xuICBjb2xvcjogd2hpdGU7XG4gIGZvbnQtc2l6ZTogMzZweDtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBsZWZ0OiA1MCU7XG4gIGZpbHRlcjogZHJvcC1zaGFkb3coMHB4IC0ycHggMHB4IHJnYmEoMCwgMCwgMCwgMC40KSk7XG59XG5cbi5wb3B1cC1jb250YWluZXItYm90dG9tIC5jYXJldC11cCB7XG4gIHRvcDogLTI1cHg7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKTtcbn1cblxuLnBvcHVwLWNvbnRhaW5lci10b3AgLmNhcmV0LXVwIHtcbiAgYm90dG9tOiAtMjVweDtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHJvdGF0ZSgxODBkZWcpO1xufVxuXG5sYWJlbCB7XG4gIEBleHRlbmQgLmxhYmVsO1xufVxuXG4ucG9wdXAtYmFja2dyb3VuZCB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgdG9wOiAwO1xuICBsZWZ0OiAwO1xuICB3aWR0aDogMTAwdnc7XG4gIGhlaWdodDogMTAwdmg7XG4gIHBvaW50ZXItZXZlbnRzOiBhbGw7XG4gIHotaW5kZXg6IDE1MDA7XG4gIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC40KTtcbiAgdHJhbnNpdGlvbjogYWxsIDAuNXMgY3ViaWMtYmV6aWVyKDAuNDU1LCAwLjAzLCAwLjUxNSwgMC45NTUpO1xufVxuXG4udWktY2FyZC1zaGFkb3cge1xuICB6LWluZGV4OiAxNTAxO1xufVxuXG4udWktY2FyZC1mb290ZXIge1xuICB0ZXh0LWFsaWduOiByaWdodDtcbn1cbiJdfQ== */"

/***/ }),

/***/ "./src/app/geo-web/map/map-popup/map-popup.service.ts":
/*!************************************************************!*\
  !*** ./src/app/geo-web/map/map-popup/map-popup.service.ts ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm2015/index.js");
let PopupFormService = class PopupFormService {
    constructor() {
        this._currentPopup = undefined;
        this.subject = new rxjs_1.Subject();
    }
    get currentPopup() {
        return this._currentPopup;
    }
    getPopupSubject() {
        return this.subject.asObservable();
    }
    showPopup(popupMessage) {
        this._currentPopup = popupMessage;
        this.subject.next(popupMessage);
    }
    hidePopup() {
        if (typeof this.currentPopup.formOnCancelFn === "function") {
            this.currentPopup.formOnCancelFn();
        }
        this._currentPopup = undefined;
        this.subject.next(undefined);
    }
};
PopupFormService = __decorate([
    core_1.Injectable({
        providedIn: "root",
    }),
    __metadata("design:paramtypes", [])
], PopupFormService);
exports.PopupFormService = PopupFormService;


/***/ }),

/***/ "./src/app/geo-web/map/map.component.html":
/*!************************************************!*\
  !*** ./src/app/geo-web/map/map.component.html ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<app-map-popup #mapPopup></app-map-popup>\n\n<div id=\"map-container\" #mapContainer>\n  <div id=\"top-right-controls\" [ngClass]=\"{ 'layer-sidebar-visble': showLayerController }\">\n    <div class=\"fake-leaflet-control-lg\">\n      <a title=\"Edit Layers\" (click)=\"showLayerController = !showLayerController\">\n        <fa-icon [icon]=\"['fas', 'layer-group']\"></fa-icon>\n      </a>\n    </div>\n\n    <div class=\"fake-leaflet-control\" [ngClass]=\"{ active: showLayerValues }\">\n      <a title=\"Show Layer Values\" (click)=\"showLayerValues = !showLayerValues\">\n        <fa-icon [icon]=\"['fas', 'crosshairs']\"></fa-icon>\n      </a>\n    </div>\n\n    <!-- <div class=\"fake-leaflet-control\"\n      [ngClass]=\"{\n        active:\n          leafletMeasureDrawHandler !== undefined &&\n          leafletMeasureDrawHandler._enabled\n      }\">\n      <a title=\"Activate Ruler\"\n        (click)=\"toggleLeafletMeasurePlugin()\">\n        <fa-icon [icon]=\"['fas', 'ruler']\"></fa-icon>\n      </a>\n    </div> -->\n\n    <div id=\"layer-legends\"></div>\n  </div>\n  <div id=\"bottom-right-controls\" [ngClass]=\"{ 'layer-sidebar-visble': showLayerController }\" [hidden]=\"currentJob === undefined || jobLayers.length === 0\">\n    <div class=\"fake-leaflet-control-lg\">\n\n      <a title=\"Multiple Evacuation Messages\" (click)=\"multipleEvacMessages()\">\n        <span>&#11034;</span>\n      </a>\n    </div>\n  </div>\n\n  <p-sidebar [(visible)]=\"showLayerController\" position=\"right\" [modal]=\"false\" styleClass=\"layer-sidebar\">\n    <h1>Regions</h1>\n\n    <div class=\"sidebar-container sidebar-padding layer-sidebar-container\">\n      <!-- <h2>Map Base Layer</h2>\n\n      <div class=\"ui-grid ui-grid-responsive ui-fluid\">\n        <div class=\"ui-grid-row\">\n          <div class=\"ui-grid-col-12\">\n            <p-dropdown [options]=\"baseLayers\"\n              [(ngModel)]=\"baseLayerSelected\"\n              (ngModelChange)=\"updateLeafletLayers()\"\n              optionLabel=\"name\"></p-dropdown>\n          </div>\n        </div>\n      </div>\n\n      <br /> -->\n\n      <div [hidden]=\"currentJob === undefined || jobLayers.length === 0\">\n        <h2>Select a region</h2>\n\n        <p-orderList [value]=\"jobLayers\" [(selection)]=\"selectedLayers\" dragdrop=\"true\" dragdropScope=\"jobLayers\"\n          [listStyle]=\"{ height: 'fit-content', 'min-height': '150px' }\" controlsPosition=\"right\" (onReorder)=\"setLayerZOrder()\"\n          (click)=\"getSelectedLayer($event)\">\n          <ng-template let-layer pTemplate=\"item\">\n            <div class=\"ui-helper-clearfix\">\n              <a class=\"icon-toggle\" (click)=\"toggleLayerOpacity($event, layer)\" [ngClass]=\"layer.visible ? 'default-col' : 'secondary-col'\">\n                <fa-icon [icon]=\"['fas', 'eye']\" size=\"sm\" *ngIf=\"layer.visible\"></fa-icon>\n                <fa-icon [icon]=\"['fas', 'eye-slash']\" size=\"sm\" *ngIf=\"!layer.visible\"></fa-icon>\n              </a>\n              {{ layer.name }}\n            </div>\n          </ng-template>\n        </p-orderList>\n      </div>\n\n      <div *ngFor=\"let selectedLayer of selectedLayers\">\n        <h2>\n          <a style=\"color: inherit;\" (click)=\"toggleLayerOpacity($event, selectedLayer)\">\n            {{ selectedLayer.name }}\n          </a>\n          <a class=\"icon-toggle\" (click)=\"toggleLayerOpacity($event, selectedLayer)\" [ngClass]=\"selectedLayer.visible ? 'default-col' : 'secondary-col'\">\n            <fa-icon [icon]=\"['fas', 'eye']\" size=\"sm\" *ngIf=\"selectedLayer.visible\"></fa-icon>\n            <fa-icon [icon]=\"['fas', 'eye-slash']\" size=\"sm\" *ngIf=\"!selectedLayer.visible\"></fa-icon>\n          </a>\n        </h2>\n\n        <div *ngIf=\"selectedLayer.dimensionsArray !== undefined\">\n          <div *ngFor=\"let dimension of selectedLayer.dimensionsArray\">\n            <span class=\"label\">{{ dimension.label }}</span>\n            <p-dropdown [options]=\"dimension.options\" optionLabel=\"label\" [(ngModel)]=\"dimension.selected\"\n              (ngModelChange)=\"selectedLayer.updateLayer()\" [filter]=\"true\" [appendTo]=\"mapContainer\" baseZIndex=\"1400\">\n            </p-dropdown>\n          </div>\n        </div>\n\n        <div *ngIf=\"selectedLayer.filterValuesArray !== undefined\">\n          <div *ngFor=\"let filerValue of selectedLayer.filterValuesArray\">\n            <span class=\"label\"><b>{{ filerValue.label }}</b></span>\n            <div class=\"ui-grid\">\n              <div class=\"ui-grid-col-6\" style=\"padding-right: 5px\">\n                <span class=\"label\" style=\"margin-top: 0;\">Min value</span>\n                <input type=\"number\" pInputText placeholder=\"Minimum value\" [(ngModel)]=\"filerValue.minValue\"\n                  (ngModelChange)=\"renderUpdatedLayer(selectedLayer)\" [customValidator]=\"customFormValidators.floatValidator\" />\n              </div>\n              <div class=\"ui-grid-col-6\" style=\"padding-left: 5px\">\n                <span class=\"label\" style=\"margin-top: 0;\">Max value</span>\n                <input type=\"number\" pInputText placeholder=\"Maximum value\" [(ngModel)]=\"filerValue.maxValue\"\n                  (ngModelChange)=\"renderUpdatedLayer(selectedLayer)\" [customValidator]=\"customFormValidators.floatValidator\" />\n              </div>\n            </div>\n          </div>\n\n        </div>\n\n        <div *ngIf=\"\n            selectedLayer.downloadData !== undefined &&\n            !selectedLayer.downloadData.disabled\n          \">\n          <p-button *ngIf=\"isString(selectedLayer.downloadData.action)\" label=\"Download\" icon=\"pi pi-download\" iconPos=\"left\"\n            styleClass=\"ui-button-secondary\" (click)=\"\n              downloadUrl(selectedLayer.downloadData.action, 'image/tiff')\n            \"\n            pTooltip=\"{{ selectedLayer.downloadData.description }}\" tooltipPosition=\"top\" tooltipZIndex=\"1400\"></p-button>\n          <p-button *ngIf=\"isFunction(selectedLayer.downloadData.action)\" label=\"Download\" icon=\"pi pi-download\"\n            iconPos=\"left\" styleClass=\"ui-button-secondary\" (click)=\"selectedLayer.downloadData.action($event)\"\n            pTooltip=\"{{ selectedLayer.downloadData.description }}\" tooltipPosition=\"top\" tooltipZIndex=\"1400\"></p-button>\n\n          <span *ngIf=\"\n              isString(selectedLayer.downloadData.metadata) &&\n              selectedLayer.downloadData.metadata !== ''\n            \">\n            <p-dialog header=\"{{ selectedLayer.name }} metadata\" [(visible)]=\"showLayerMetadataPopup\" appendTo=\"body\"\n              baseZIndex=\"1500\" modal=\"true\" styleClass=\"modal-dialog\" dismissableMask=\"true\" [closeOnEscape]=\"false\">\n              <pre>{{ selectedLayer.downloadData.metadata }}</pre>\n            </p-dialog>\n            &nbsp;\n\n            <p-button type=\"button\" (click)=\"showLayerMetadataPopup = !showLayerMetadataPopup\" icon=\"pi pi-info-circle\"\n              label=\"View metadata\" iconPos=\"left\" styleClass=\"ui-button-secondary\"></p-button>\n          </span>\n        </div>\n        <div class=\"line_break\"></div>\n        <h3>Scenario Settings</h3>\n        <div *ngIf=\"\n        selectedLayer.fire !== undefined &&\n        selectedLayer.fire.options.length > 0\n        \">\n          <span class=\"label\">Fire</span>\n          <p-dropdown [options]=\"selectedLayer.fire.options\" optionLabel=\"name\" [filter]=\"true\" [appendTo]=\"mapContainer\"\n            baseZIndex=\"1400\" (onChange)=\"getSelectedFire($event)\">\n          </p-dropdown>\n        </div>\n\n        <div *ngIf=\"\n        selectedLayer.population !== undefined &&\n        selectedLayer.population.options.length > 0\n      \">\n          <span class=\"label\">Population</span>\n          <p-dropdown [options]=\"selectedLayer.population.options\" optionLabel=\"name\" [filter]=\"true\" [appendTo]=\"mapContainer\"\n            baseZIndex=\"1400\" (onChange)=\"getSelectedPopulation($event)\">\n          </p-dropdown>\n        </div>\n\n        <div *ngIf=\"\n        selectedLayer.time !== undefined\">\n          <span class=\"label\">Time {{timeFromSlider}}</span>\n\n          <p-slider [(ngModel)]=\"timeSliderStep\" [min]=\"0\" [max]=\"1440\" [step]=\"10\" (onChange)=\"getSelectedTime($event)\"></p-slider>\n        </div>\n\n        <div>\n          <a class=\"icon-toggle\" (click)=\"showZoneLayers()\">\n            <fa-icon [icon]=\"['fas', 'eye']\" size=\"sm\" *ngIf=\"zoneVisibility\"></fa-icon>\n            <fa-icon [icon]=\"['fas', 'eye-slash']\" size=\"sm\" style=\"color:gray\" *ngIf=\"!zoneVisibility\"></fa-icon>\n          </a>\n          <span class=\"label\"> Show Evacuation Zones</span>\n        </div>\n\n        <div [hidden]=\"currentJob === undefined || jobLayers.length === 0\">\n          <h2>Evacuation Plan</h2>\n\n          <p-listbox [options]=\"messageListOptions\" [(ngModel)]=\"selectedMessage\" [style]=\"{'width':'100%','height':\n            '100px' }\"\n            [listStyle]=\"{'max-height': '100px'}\">\n            <ng-template let-enteredEvacMessage let-i=\"index\" pTemplate=\"item\">\n              <div class=\"ui-helper-clearfix\">\n\n                <a class=\"icon-link\" (click)=\"highlightZoneHandler(i)\" (dblclick)=\"editMessageDialog(i)\">\n                  {{enteredEvacMessage.label}} : {{enteredEvacMessage.type}}\n                </a>\n                <a title=\"Delete Message\" class=\"icon-link\" (click)=\"deleteMessageHandler(i)\" disabled>\n                  <fa-icon [icon]=\"['fas', 'trash']\"></fa-icon>\n                </a>\n              </div>\n            </ng-template>\n          </p-listbox>\n        </div>\n\n\n\n        <div *ngIf=\"\n            selectedLayer.speed !== undefined\">\n          <span class=\"label\">Maximum speed on roads {{selectedLayer.speed}}%</span>\n\n          <p-slider disabled=\"true\" [(ngModel)]=\"selectedLayer.speed\" [min]=\"0\" [max]=\"100\" [step]=\"10\" (onChange)=\"getMaxSpeed($event)\"></p-slider>\n        </div>\n        <h3>Map & Layers Settings</h3>\n        <div>\n          <span class=\"ui-grid-col-4\" style=\"margin-bottom: 4px\">Map Style </span>\n          <p-dropdown disabled=\"true\" class=\"ui-grid-col-8\" [options]=\"mapStyles.options\" optionLabel=\"style\"\n            baseZIndex=\"1400\" (onChange)=\"changeMapStyle($event)\" [appendTo]=\"mapContainer\" [style]=\"{'margin-bottom': '5px'}\">\n          </p-dropdown>\n        </div>\n        <div>\n          <span class=\"label\">Road Network Opacity</span>\n\n          <p-slider [(ngModel)]=\"selectedLayer.opacity\" [min]=\"0\" [max]=\"100\"></p-slider>\n        </div>\n        <!-- <div *ngIf=\"\n        selectedLayer.evacMessage!== undefined &&\n        selectedLayer.evacMessage.options.length > 0\n        \">\n          <span class=\"label\">Evacuation Message</span>\n          <p-dropdown [options]=\"selectedLayer.evacMessage.options\" optionLabel=\"message\" [filter]=\"true\" [appendTo]=\"mapContainer\"\n            baseZIndex=\"1400\" (onChange)=\"getEvacMessage($event)\">\n          </p-dropdown>\n        </div> -->\n\n\n\n        <div *ngIf=\"\n            selectedLayer.blendMode !== undefined &&\n            selectedLayer.blendModes.length > 0\n          \">\n          <span class=\"label\">Blend mode</span>\n          <p-dropdown [options]=\"selectedLayer.blendModes\" optionLabel=\"name\" [(ngModel)]=\"selectedLayer.blendMode\"\n            (ngModelChange)=\"renderUpdatedLayer(selectedLayer)\" [filter]=\"true\" [appendTo]=\"mapContainer\" baseZIndex=\"1400\">\n          </p-dropdown>\n        </div>\n\n\n        <div *ngIf=\"\n            selectedLayer.colourScheme !== undefined &&\n            selectedLayer.colourScheme.type === 'SolidColourScheme'\n          \">\n          <span class=\"label\"><b>Colour scale</b></span>\n          <p-colorPicker [(ngModel)]=\"selectedLayer.colourScheme.solidColour\" (ngModelChange)=\"renderUpdatedLayer(selectedLayer)\"\n            [appendTo]=\"mapContainer\" baseZIndex=\"1400\"></p-colorPicker>\n        </div>\n\n        <div *ngIf=\"\n            selectedLayer.colourScheme !== undefined &&\n            selectedLayer.colourScheme.type === 'D3ColourScheme'\n          \">\n          <span class=\"label\"><b>Colour scale</b></span>\n          <p-dropdown [options]=\"selectedLayer.colourScheme.predefinedSchemes\" optionLabel=\"name\" [(ngModel)]=\"selectedLayer.colourScheme.predefinedScheme\"\n            (ngModelChange)=\"renderUpdatedLayer(selectedLayer)\" [filter]=\"true\" [appendTo]=\"mapContainer\" baseZIndex=\"1400\">\n            <!-- <ng-template let-colourScheme pTemplate=\"item\">\n            {{colourScheme.name}}\n          </ng-template> -->\n          </p-dropdown>\n          <br /><br />\n          <p-toggleButton onLabel=\"Reversed\" offLabel=\"Reverse\" onIcon=\"pi pi-check\" offIcon=\"pi pi-times\" [(ngModel)]=\"selectedLayer.colourScheme.reversed\"\n            (ngModelChange)=\"renderUpdatedLayer(selectedLayer)\"></p-toggleButton>\n        </div>\n\n        <div *ngIf=\"\n            selectedLayer.colourByProperty !== undefined &&\n            selectedLayer.colourByProperty.options.length > 0\n          \">\n          <span class=\"label\">Colour by</span>\n\n          <p-dropdown [options]=\"selectedLayer.colourByProperty.options\" [(ngModel)]=\"selectedLayer.colourByProperty.selected\"\n            (ngModelChange)=\"renderUpdatedLayer(selectedLayer)\" optionLabel=\"label\"></p-dropdown>\n        </div>\n\n        <div *ngIf=\"\n            selectedLayer.minValue !== undefined &&\n            selectedLayer.maxValue !== undefined\n          \">\n          <div *ngIf=\"selectedLayer.valueTransformation !== undefined\">\n            <span class=\"label\">Min value</span>\n            <input type=\"number\" pInputText placeholder=\"Minimum value\" [(ngModel)]=\"selectedLayer.minValueTransformed\"\n              (ngModelChange)=\"renderUpdatedLayer(selectedLayer)\" required [customValidator]=\"customFormValidators.floatValidator\" />\n            <br /><span class=\"label\">Max value</span>\n            <input type=\"number\" pInputText placeholder=\"Maximum value\" [(ngModel)]=\"selectedLayer.maxValueTransformed\"\n              (ngModelChange)=\"renderUpdatedLayer(selectedLayer)\" required [customValidator]=\"customFormValidators.floatValidator\" />\n          </div>\n          <div *ngIf=\"selectedLayer.valueTransformation === undefined\">\n            <span class=\"label\">Min value</span>\n            <input type=\"number\" pInputText placeholder=\"Minimum value\" [(ngModel)]=\"selectedLayer.minValue\"\n              (ngModelChange)=\"renderUpdatedLayer(selectedLayer)\" required [customValidator]=\"customFormValidators.floatValidator\" />\n            <br /><span class=\"label\">Max value</span>\n            <input type=\"number\" pInputText placeholder=\"Maximum value\" [(ngModel)]=\"selectedLayer.maxValue\"\n              (ngModelChange)=\"renderUpdatedLayer(selectedLayer)\" required [customValidator]=\"customFormValidators.floatValidator\" />\n          </div>\n        </div>\n\n      </div>\n\n      <br /><br />\n    </div>\n  </p-sidebar>\n\n  <p-sidebar [(visible)]=\"showChartController\" position=\"bottom\" [modal]=\"false\" styleClass=\"chart-sidebar height-fit-content\">\n    <h3>Result</h3>\n\n    <div id=\"chart-container\">\n      <div id=\"chart\"></div>\n    </div>\n  </p-sidebar>\n\n  <!-- \n  \n        <a  *ngIf=\"currentJob !== undefined\"\n          class=\"leaflet-toolbar-icon leaflet-toolbar-icon-custom\"\n          title=\"Zoom to extent\"\n          (click)=\"zoomToJobBbox()\">\n          <fa-icon [icon]=\"['fas', 'search']\"\n            size=\"sm\"></fa-icon>\n        </a>\n     -->\n\n\n  <div id=\"edit-feature-controller\" [ngClass]=\"{\n      hidden: jobLayers.length === 0 || currentJob === undefined\n    }\">\n    <div class=\"fake-leaflet-control-lg\" *ngIf=\"currentChart !== undefined\">\n      <a title=\"Show Chart\" (click)=\"showChartController = !showChartController\">\n        <fa-icon [icon]=\"['fas', 'poll']\"></fa-icon>\n      </a>\n    </div>\n\n    <!-- <div class=\"mapboxgl-ctrl mapboxgl-ctrl-group\">\n      <button class=\"mapboxgl-ctrl-icon\"></button>\n      </div> -->\n    <div class=\"mapboxgl-ctrl mapboxgl-ctrl-group\">\n      <button *ngFor=\"let toolbarButton of editableFeatureToolbarButtons\" class=\"mapboxgl-ctrl-icon\" [title]=\"toolbarButton.title\"\n        (click)=\"toolbarButton.createNewFn()\">\n        <fa-icon [icon]=\"toolbarButton.primaryFaIcon\" size=\"sm\" [ngClass]=\"{\n                'draw-fire-icon': toolbarButton.secondaryFaIcon !== undefined\n              }\"></fa-icon>\n        <fa-icon *ngIf=\"toolbarButton.secondaryFaIcon !== undefined\" [icon]=\"toolbarButton.secondaryFaIcon\" size=\"xs\"\n          class=\"secondary-draw-fire-icon\"></fa-icon>\n      </button>\n    </div>\n\n    <div class=\"mapboxgl-ctrl mapboxgl-ctrl-group\" *ngIf=\"editableFeatureToolbarButtons.length > 0\">\n      <button class=\"mapboxgl-ctrl-icon\" title=\"Edit features\" (click)=\"toggleFeatureEdit()\" #mapboxDrawEditButton>\n        <fa-icon [icon]=\"['fas', 'pen']\" size=\"sm\"></fa-icon>\n\n      </button>\n    </div>\n  </div>\n  <div class=\"legend-overlay\" *ngIf=\"activities != null\">\n    <div class=\"legend-overlay-inner\">\n      <table id=\"pop-legend\" cellspacing=\"3px\">\n        <tbody>\n          <tr *ngFor=\"let data of activities | keyvalue\">\n            <td class=\"p-2\">\n              <input type=\"color\" disabled=\"disabled\" value={{data.value}}>\n            </td>\n            <td>\n              {{data.key}}\n            </td>\n          </tr>\n        </tbody>\n\n      </table>\n    </div>\n  </div>\n\n  <!-- Play button + Digital clock-->\n  <div id=\"simulation-play\" class=\"\" [ngStyle]=\"{'bottom': showChartController ? '300px' : '10px'}\" *ngIf=\"currentJob !== undefined &&  jobType =='emv2' && currentJob.status == 'FINISHED' \">\n\n\n    <div class=\"\" *ngIf=\"currentJob !== undefined &&  jobType =='emv2' && currentJob.status == 'FINISHED' \">\n      <a title=\"Play\" (click)=\"playSimulation()\">\n        <fa-icon [icon]=\"['fas','pause']\" *ngIf=\"isPlaying\"></fa-icon>\n\n        <fa-icon [icon]=\"['fas', 'play']\" *ngIf=\"!isPlaying\"></fa-icon> {{simulationStatus}} {{clock}}\n      </a>\n      <!-- <p-slider [(ngModel)]=\"this.animationSpeed\" [min]=\"0\" [max]=\"100\" [step]=\"10\" (onChange)=\"setAnimationSpeed($event)\"></p-slider> -->\n      <!-- animation speed {{animationSpeed}}x -->\n      Animation speed\n      <p-spinner [(ngModel)]=\"this.animationSpeed\" [size]=\"2\" [min]=\"0\" [max]=\"100\" [step]=\"10\" (onChange)=\"setAnimationSpeed($event)\"></p-spinner>\n      X\n\n\n    </div>\n  </div>\n  <!-- Animation speed controller -->\n\n\n  <div id=\"timeline-controller\" class=\"fake-leaflet-control-colours\" [ngStyle]=\"{'bottom': showChartController ? '300px' : '10px'}\"\n    *ngIf=\"currentJob !== undefined && timeSliders.length !== 0\">\n    <div class=\"timeline\" [ngClass]=\"{\n        hidden: !(\n          currentJob.status === 'FINISHED' &&\n          arrivalTimeContourLayer !== undefined\n        )\n      }\"\n      *ngFor=\"let timeSlider of timeSliders\">\n      <span class=\"time-slider-label\">\n        <fa-icon [icon]=\"['fas', 'clock']\" size=\"sm\"></fa-icon>\n        &nbsp;Time\n      </span>\n      <p-slider [(ngModel)]=\"timeSlider.value\" [min]=\"timeSlider.min\" [max]=\"timeSlider.max\" [step]=\"timeSlider.step\"\n        class=\"time-slider\"></p-slider>\n      <!-- <input class=\"time-input\" type=\"number\" pInputText [(ngModel)]=\"timeSliderValue\" (ngModelChange)=\"timeSliderChange($event)\"/>\n    <span class=\"time-slider-label\">&nbsp; second{{(timeSliderValue !== 1) ? 's' : ''}}</span> -->\n      <!-- (ngModelChange)=\"timeSliderDateChange($event)\" -->\n      <p-calendar [(ngModel)]=\"timeSlider.valueDate\" showTime=\"true\" hourFormat=\"24\" showIcon=\"true\" class=\"p-autocomplete\"\n        inputStyleClass=\"time-input\" [minDate]=\"timeSlider.minDate\" [maxDate]=\"timeSlider.maxDate\" appendTo=\"body\"></p-calendar>\n    </div>\n  </div>\n  <p-dialog header=\"Evacuation Messages\" [(visible)]=\"emergencyMessageDialog\" widgetVar=\"dlg2\" modal=\"true\" appendTo=\"body\"\n    position=\"top\" [closable]=\"false\">\n    <h3 *ngIf=\"!updateMessage\"> List your messages here </h3>\n    <h3 *ngIf=\"updateMessage\"> Update message</h3>\n\n    <div class=\"ui-inputgroup\">\n      <input type=\"text\" pInputText [(ngModel)]=\"broadcastZoneString\" disabled=\"true\" [style]=\"{'margin':'2px'}\" />\n    </div>\n    <div class=\"ui-inputgroup\">\n      <span class=\"ui-grid-col-8\" [style]=\"{'margin':'2px'}\">Time </span>\n      <p-calendar class=\"ui-grid-col-4\" [(ngModel)]=\"selectedMessageSendTime\" showTime=\"true\" hourFormat=\"24\" timeOnly=\"true\"\n        [style]=\"{'margin':'2px','margin-right':'-9%' }\" (ngModelChange)=\"updateErrorMessagesTime()\" [stepMinute]=\"15\"></p-calendar><br>\n    </div>\n    <div class=\"ui-inputgroup\">\n      <span class=\"ui-grid-col-8\" [style]=\"{'margin': '0px'}\">Message Type </span>\n      <p-dropdown class=\"ui-grid-col-4\" [(ngModel)]=\"selectedEvacMessage\" [options]=\"evacMessages.options\" optionLabel=\"message\"\n        baseZIndex=\"1400\" [style]=\"{'margin-left': '-11px'}\" (ngModelChange)=\"updateErrorMessagesType()\">\n      </p-dropdown> <br>\n    </div>\n    <div class=\"ui-inputgroup\">\n      <textarea [rows]=\"3\" [cols]=\"60\" pInputTextarea autoResize=\"autoResize\" [(ngModel)]=\"messageContent\" placeholder=\"Content\"></textarea>\n    </div>\n    <ul>\n      <li *ngIf=\"Errors.messageType\" class=\"ui-message ui-messages-error\">\n        Please select a Evacuation Message type\n      </li>\n      <li *ngIf=\"Errors.time\" class=\"ui-message ui-messages-error\">\n        Please select a Time\n      </li>\n      <li *ngIf=\"Errors.content\" class=\"ui-message ui-messages-error\">\n        Please add a content to this message\n      </li>\n      <li *ngIf=\"Errors.duplicate\" class=\"ui-message ui-messages-error\">\n        Duplicate Entry\n      </li>\n    </ul>\n\n    <!-- <p-listbox *ngIf=\"!updateMessage\" [options]=\"enteredEvacMessages\">\n      <ng-template let-enteredEvacMessage let-i=\"index\" pTemplate=\"item\">\n        <div class=\"ui-helper-clearfix\">\n          <span>{{i+1}}) </span>\n          <span>{{enteredEvacMessage.broadcastHHMM}} </span>\n          <span>{{enteredEvacMessage.type}} </span>\n          <span>{{enteredEvacMessage.broadcastZones}} </span>\n\n          <a title=\"Delete Message\" class=\"icon-link\" (click)=\"deleteMessage(i)\" disabled>\n            <fa-icon [icon]=\"['fas', 'trash']\"></fa-icon>\n          </a>\n        </div>\n      </ng-template>\n    </p-listbox> -->\n    <p-footer>\n      <button type=\"button\" pButton icon=\"pi pi-times\" (click)=\"showEmergencyMessageDialog()\" label=\"Close \" class=\"ui-button-secondary\"></button>\n      <button *ngIf=\"!updateMessage\" type=\"button\" pButton icon=\"pi pi-check\" (click)=\"addNewMessage()\" label=\"Add\"></button>\n      <button *ngIf=\"updateMessage\" type=\"button\" pButton icon=\"pi pi-check\" (click)=\"evacuationMessageUpdateHandler()\"\n        label=\"Update\"></button>\n    </p-footer>\n  </p-dialog>\n  <div id=\"map\"></div>\n\n  <svg class=\"svg-overlay\"></svg>\n\n  <!-- https://research.csiro.au/geoweb/ -->\n  <div class=\"map-logo\">\n\n\n    <img src=\"assets/img/logo/favicon.ico\" alt=\"INDRA Logo\" class=\"map-logo-img\" />\n    <div class=\"logo-text\"></div>\n  </div>\n\n</div>"

/***/ }),

/***/ "./src/app/geo-web/map/map.component.scss":
/*!************************************************!*\
  !*** ./src/app/geo-web/map/map.component.scss ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".fake-leaflet-control,\n.fake-leaflet-control-lg,\n.fake-leaflet-control-colours,\nbody .ui-sidebar,\n#layer-legends .legend,\n.layer-values-popup .leaflet-popup-content-wrapper,\n.layer-values-popup .leaflet-popup-tip,\n#simulation-play {\n  color: #333;\n  background: #fff;\n  border-radius: 4px;\n  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);\n  border: none;\n  background-clip: padding-box; }\n\n.fake-leaflet-control.active,\n.fake-leaflet-control-lg.active,\n.fake-leaflet-control-colours.active,\nbody .active.ui-sidebar,\n#layer-legends .active.legend,\n.layer-values-popup .active.leaflet-popup-content-wrapper,\n.layer-values-popup .active.leaflet-popup-tip,\n.active#simulation-play {\n  background-color: #007ad9;\n  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);\n  color: #ffffff; }\n\n.fake-leaflet-control,\n.fake-leaflet-control-lg {\n  margin-bottom: 10px;\n  position: relative; }\n\n.fake-leaflet-control {\n  height: 30px;\n  width: 30px; }\n\n.fake-leaflet-control-lg {\n  height: 44px;\n  width: 44px; }\n\n.fake-leaflet-control a,\n.fake-leaflet-control-lg a {\n  color: inherit;\n  height: 100%;\n  width: 100%;\n  display: block;\n  line-height: 0; }\n\n.fake-leaflet-control:hover,\n.fake-leaflet-control-lg:hover {\n  background-color: #f4f4f4; }\n\n.fake-leaflet-control a:hover,\n.fake-leaflet-control-lg a:hover {\n  color: #333;\n  cursor: pointer; }\n\n.fake-leaflet-control.active:hover,\n.fake-leaflet-control-lg.active:hover {\n  background-color: #1775bd; }\n\n.fake-leaflet-control.active a:hover,\n.fake-leaflet-control-lg.active a:hover,\n.fake-leaflet-control-colours.active a:hover,\nbody .active.ui-sidebar a:hover,\n#layer-legends .active.legend a:hover,\n.layer-values-popup .active.leaflet-popup-content-wrapper a:hover,\n.layer-values-popup .active.leaflet-popup-tip a:hover,\n.active#simulation-play a:hover {\n  color: #ffffff; }\n\n.fake-leaflet-control fa-icon.ng-fa-icon,\n.fake-leaflet-control-lg fa-icon.ng-fa-icon {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%); }\n\n.fake-leaflet-control a {\n  font-size: 12px; }\n\n.fake-leaflet-control-lg a {\n  font-size: 24px; }\n\n.fake-leaflet-control-lg span {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%); }\n\n* {\n  box-sizing: border-box; }\n\nbody,\nhtml {\n  font-family: Roboto, \"Helvetica Neue\", Helvetica, Arial, sans-serif !important;\n  font-size: 14px;\n  margin: 0;\n  padding: 0; }\n\n.c3 text {\n  font-family: Roboto, \"Helvetica Neue\", Helvetica, Arial, sans-serif !important;\n  font-size: 14px; }\n\nh1,\n.h1 {\n  font-size: 24px;\n  font-weight: 600; }\n\nh2,\n.h2 {\n  font-size: 18px;\n  font-weight: 500; }\n\npre {\n  word-break: break-word;\n  overflow-x: auto;\n  white-space: pre-wrap;\n  white-space: -moz-pre-wrap;\n  white-space: -pre-wrap;\n  white-space: -o-pre-wrap;\n  word-wrap: break-word; }\n\n.font-italic-light {\n  font-weight: 100;\n  font-style: italic; }\n\n.text-overflow-ellipsis {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis; }\n\n.label,\nlabel {\n  display: block;\n  margin-bottom: 10px;\n  margin-top: 20px; }\n\n.badge > .pi {\n  padding-right: 4px; }\n\na.icon-link:last-of-type {\n  padding-right: 10px; }\n\na.icon-link:first-of-type {\n  padding-left: 10px; }\n\na.icon-link {\n  font-size: 0.85em;\n  padding: 0 5px; }\n\nbody .ui-widget-overlay {\n  background-color: rgba(0, 0, 0, 0.2);\n  transition: all linear 0.2s; }\n\n.ui-state-highlight a.icon-link {\n  color: #ffffff; }\n\n.ui-state-highlight a.icon-link:hover {\n  color: #ffffffba; }\n\n.empty-placeholder {\n  color: #999;\n  font-weight: 100;\n  padding: 20px 0;\n  /* height: 100%; */\n  text-align: center; }\n\n.ui-toast {\n  max-height: 100vh;\n  overflow-y: auto; }\n\n.ui-toast-detail {\n  word-break: break-word; }\n\n.modal-dialog.ui-dialog {\n  width: 400px; }\n\n.ui-dialog .ui-grid .ui-grid-row {\n  margin-bottom: 10px; }\n\n.ui-dialog .ui-listbox .ui-listbox-list-wrapper {\n  max-height: calc(100vh - 400px);\n  min-height: 100px; }\n\nbody .ui-dialog .ui-dialog-content {\n  max-height: calc(100vh - 200px);\n  min-height: 200px;\n  overflow-y: auto;\n  overflow-y: overlay;\n  -ms-overflow-style: -ms-autohiding-scrollbar;\n  border-left: none;\n  border-right: none; }\n\nbody .ui-dialog .ui-dialog-titlebar,\nbody .ui-dialog .ui-dialog-footer {\n  border-left: none;\n  border-right: none; }\n\nbody .ui-dialog .ui-dialog-titlebar {\n  border-top: none; }\n\nbody .ui-dialog .ui-dialog-footer {\n  border-bottom: none; }\n\n.ui-dialog .ui-listbox .ui-progressbar {\n  display: inline-block;\n  width: 100%;\n  height: 14px;\n  margin-top: 3px;\n  margin-bottom: -3px;\n  background-color: #0000004a; }\n\n.ui-dialog .ui-listbox .ui-progressbar .ui-progressbar-label {\n  font-size: 12px;\n  line-height: 1.25;\n  color: inherit; }\n\n.ui-dialog .ui-listbox .ui-progressbar .ui-progressbar-value {\n  background: #0000006b; }\n\nbody .ui-widget,\nbody .ui-autocomplete.ui-autocomplete-multiple .ui-autocomplete-multiple-container .ui-autocomplete-input-token input,\nbody .ui-chips > ul.ui-inputtext .ui-chips-input-token input,\nbody .ui-table .ui-editable-column input,\nbody .ui-treetable .ui-editable-column input,\nbody .ui-terminal .ui-terminal-input {\n  font-family: Roboto, \"Helvetica Neue\", Helvetica, Arial, sans-serif !important; }\n\nbody .secondary-col, body .ui-orderlist .ui-orderlist-controls button,\nbody .ui-button.ui-state-default.ui-button-secondary,\nbody .ui-buttonset.ui-button-secondary > .ui-button.ui-state-default {\n  color: #333333;\n  background-color: #e8e8e8;\n  border-color: #e8e8e8; }\n\nbody .secondary-col:hover, body .ui-orderlist .ui-orderlist-controls button:hover,\nbody .ui-button.ui-state-default.ui-button-secondary:enabled:hover,\nbody .ui-buttonset.ui-button-secondary > .ui-button.ui-state-default:enabled:hover {\n  background-color: #c8c8c8;\n  color: #333333;\n  border-color: #c8c8c8; }\n\nbody .secondary-col:enabled:focus, body .ui-orderlist .ui-orderlist-controls button:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-secondary:enabled:focus,\nbody .ui-buttonset.ui-button-secondary > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #8dcdff; }\n\nbody .secondary-col:active, body .ui-orderlist .ui-orderlist-controls button:active,\nbody .ui-button.ui-state-default.ui-button-secondary:enabled:active,\nbody .ui-buttonset.ui-button-secondary > .ui-button.ui-state-default:enabled:active {\n  background-color: #a0a0a0;\n  color: #333333;\n  border-color: #a0a0a0; }\n\nbody .default-col,\nbody .ui-button.ui-state-default.ui-button-info,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default {\n  color: #ffffff;\n  background-color: #007ad9;\n  border-color: #007ad9; }\n\nbody .default-col:hover,\nbody .ui-button.ui-state-default.ui-button-info:enabled:hover,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default:enabled:hover {\n  background-color: #116fbf;\n  color: #ffffff;\n  border-color: #116fbf; }\n\nbody .default-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-info:enabled:focus,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #8dcdff; }\n\nbody .default-col:active,\nbody .ui-button.ui-state-default.ui-button-info:enabled:active,\nbody .ui-buttonset.ui-button-info > .ui-button.ui-state-default:enabled:active {\n  background-color: #005b9f;\n  color: #ffffff;\n  border-color: #005b9f; }\n\nbody .success-col,\nbody .ui-button.ui-state-default.ui-button-success,\nbody .ui-buttonset.ui-button-success > .ui-button.ui-state-default {\n  color: #ffffff;\n  background-color: #34a835;\n  border-color: #34a835; }\n\nbody .success-col:hover,\nbody .ui-button.ui-state-default.ui-button-success:enabled:hover,\nbody .ui-buttonset.ui-button-success > .ui-button.ui-state-default:enabled:hover {\n  background-color: #107d11;\n  color: #ffffff;\n  border-color: #107d11; }\n\nbody .success-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-success:enabled:focus,\nbody .ui-buttonset.ui-button-success > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #aae5aa; }\n\nbody .success-col:active,\nbody .ui-button.ui-state-default.ui-button-success:enabled:active,\nbody .ui-buttonset.ui-button-success > .ui-button.ui-state-default:enabled:active {\n  background-color: #0c6b0d;\n  color: #ffffff;\n  border-color: #0c6b0d; }\n\nbody .success-col-outline,\nbody .ui-button.ui-state-default.ui-button-success-outline,\nbody .ui-buttonset.ui-button-success-outline > .ui-button.ui-state-default {\n  color: #34a835;\n  background-color: #fff;\n  border-color: #fff; }\n\nbody .success-col-outline:hover,\nbody .ui-button.ui-state-default.ui-button-success-outline:enabled:hover,\nbody .ui-buttonset.ui-button-success-outline > .ui-button.ui-state-default:enabled:hover {\n  background-color: #fff;\n  color: #107d11;\n  border-color: #fff; }\n\nbody .success-col-outline:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-success-outline:enabled:focus,\nbody .ui-buttonset.ui-button-success-outline > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #aae5aa; }\n\nbody .success-col-outline:active,\nbody .ui-button.ui-state-default.ui-button-success-outline:enabled:active,\nbody .ui-buttonset.ui-button-success-outline > .ui-button.ui-state-default:enabled:active {\n  background-color: #fff;\n  color: #0c6b0d;\n  border-color: #fff; }\n\nbody .warning-col,\nbody .ui-button.ui-state-default.ui-button-warning,\nbody .ui-buttonset.ui-button-warning > .ui-button.ui-state-default {\n  color: #333333;\n  background-color: #ffba01;\n  border-color: #ffba01; }\n\nbody .warning-col:hover,\nbody .ui-button.ui-state-default.ui-button-warning:enabled:hover,\nbody .ui-buttonset.ui-button-warning > .ui-button.ui-state-default:enabled:hover {\n  background-color: #ed990b;\n  color: #333333;\n  border-color: #ed990b; }\n\nbody .warning-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-warning:enabled:focus,\nbody .ui-buttonset.ui-button-warning > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #ffeab4; }\n\nbody .warning-col:active,\nbody .ui-button.ui-state-default.ui-button-warning:enabled:active,\nbody .ui-buttonset.ui-button-warning > .ui-button.ui-state-default:enabled:active {\n  background-color: #d38b10;\n  color: #333333;\n  border-color: #d38b10; }\n\nbody .danger-col,\nbody .ui-button.ui-state-default.ui-button-danger,\nbody .ui-buttonset.ui-button-danger > .ui-button.ui-state-default {\n  color: #ffffff;\n  background-color: #e91224;\n  border-color: #e91224; }\n\nbody .danger-col:hover,\nbody .ui-button.ui-state-default.ui-button-danger:enabled:hover,\nbody .ui-buttonset.ui-button-danger > .ui-button.ui-state-default:enabled:hover {\n  background-color: #c01120;\n  color: #ffffff;\n  border-color: #c01120; }\n\nbody .danger-col:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-danger:enabled:focus,\nbody .ui-buttonset.ui-button-danger > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #f9b4ba; }\n\nbody .danger-col:active,\nbody .ui-button.ui-state-default.ui-button-danger:enabled:active,\nbody .ui-buttonset.ui-button-danger > .ui-button.ui-state-default:enabled:active {\n  background-color: #a90000;\n  color: #ffffff;\n  border-color: #a90000; }\n\nbody .danger-col-outline,\nbody .ui-button.ui-state-default.ui-button-danger-outline,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default {\n  color: #e91224;\n  background-color: #fff;\n  border-color: #fff; }\n\nbody .ui-button.ui-state-default.ui-button-danger-outline,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default {\n  border-color: #e91224; }\n\nbody .danger-col-outline:hover,\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:hover,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:hover {\n  background-color: #fff;\n  color: #c01120;\n  border-color: #fff; }\n\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:hover,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:hover {\n  border-color: #c01120; }\n\nbody .danger-col-outline:enabled:focus,\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:focus,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:focus {\n  box-shadow: 0 0 0 0.2em #f9b4ba; }\n\nbody .danger-col-outline:active,\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:active,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:active {\n  background-color: #fff;\n  color: #a90000;\n  border-color: #fff; }\n\nbody .ui-button.ui-state-default.ui-button-danger-outline:enabled:active,\nbody .ui-buttonset.ui-button-danger-outline > .ui-button.ui-state-default:enabled:active {\n  border-color: #a90000; }\n\nbody .ui-dialog .ui-dialog-footer button,\nbody .ui-card .ui-card-footer button {\n  margin: 0 0 0 0.5em !important; }\n\nbody .ui-dialog {\n  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1) !important; }\n\nbody .ui-dialog .ui-dialog-titlebar {\n  border-radius: 4px 4px 0 0; }\n\nbody .ui-dialog .ui-dialog-footer {\n  border-radius: 0 0 4px 4px; }\n\nbody .ui-messages-error {\n  border: none;\n  font-weight: 800;\n  padding: 0;\n  display: block;\n  width: 100%;\n  text-align: right;\n  color: #a80000; }\n\nbody .ng-dirty.ng-invalid + ul {\n  -webkit-padding-start: 0;\n          padding-inline-start: 0; }\n\nbody .ui-inputtext.ng-invalid:enabled:focus,\n.ui-inputtext {\n  border-color: #a80000; }\n\nbody .ui-inputtext,\nbody .ui-inputgroup .ui-inputtext.ng-dirty.ng-invalid + .ui-inputgroup-addon {\n  transition: box-shadow 0.2s; }\n\nbody .ui-inputtext.ng-dirty.ng-invalid,\nbody p-dropdown.ng-dirty.ng-invalid > .ui-dropdown,\nbody p-autocomplete.ng-dirty.ng-invalid > .ui-autocomplete > .ui-inputtext,\nbody p-calendar.ng-dirty.ng-invalid > .ui-calendar > .ui-inputtext,\nbody p-chips.ng-dirty.ng-invalid > .ui-inputtext,\nbody p-inputmask.ng-dirty.ng-invalid > .ui-inputtext,\nbody p-checkbox.ng-dirty.ng-invalid .ui-chkbox-box,\nbody p-radiobutton.ng-dirty.ng-invalid .ui-radiobutton-box,\nbody p-inputswitch.ng-dirty.ng-invalid .ui-inputswitch,\nbody p-listbox.ng-dirty.ng-invalid .ui-inputtext,\nbody p-multiselect.ng-dirty.ng-invalid > .ui-multiselect,\nbody p-spinner.ng-dirty.ng-invalid > .ui-inputtext,\nbody p-selectbutton.ng-dirty.ng-invalid .ui-button,\nbody p-togglebutton.ng-dirty.ng-invalid .ui-button {\n  box-shadow: 0 0 0 0.2em #f9b4ba; }\n\nbody .ui-inputgroup .ui-inputtext.ng-dirty.ng-invalid + .ui-inputgroup-addon {\n  box-shadow: 2px -2.8px 0 #f9b4ba, 2px 2.8px 0 #f9b4ba; }\n\nbody p-calendar.ng-dirty.ng-invalid > .ui-calendar.ui-calendar-w-btn {\n  box-shadow: 0 0 0 3px #f9b4ba;\n  border-radius: 4px; }\n\nbody .ui-inputgroup .ui-inputtext:enabled:focus:not(.ui-state-error) + .ui-inputgroup-addon,\nbody p-calendar.ng-dirty.ng-invalid > .ui-calendar > .ui-inputtext:enabled:focus:not(.ui-state-error),\nbody p-calendar.ng-dirty.ng-invalid > .ui-calendar > .ui-inputtext:enabled:focus:not(.ui-state-error) + .ui-calendar-button {\n  box-shadow: none; }\n\n*:not(.ui-calendar) .ui-inputtext {\n  width: 100%; }\n\nbody .ui-state-disabled,\nbody .ui-widget:disabled {\n  cursor: not-allowed; }\n\n.form dynamic-primeng-form-control > div {\n  margin-bottom: 10px; }\n\n.form .ui-calendar,\n.form .ui-spinner {\n  width: 100%; }\n\n.form .ui-calendar-w-btn input.ui-inputtext {\n  width: calc(100% - 33px); }\n\n.form .ui-datepicker {\n  padding: 0.5em; }\n\n.form .ui-datepicker {\n  font-size: 12px; }\n\n.form .ui-datepicker .ui-timepicker {\n  padding: 10px 0 0 0;\n  font-size: 11px; }\n\n.form .ui-datepicker table {\n  font-size: 11px; }\n\n/* width */\n\n::-webkit-scrollbar {\n  width: 10px; }\n\n/* Track */\n\n::-webkit-scrollbar-track {\n  background: none; }\n\n/* Handle */\n\n::-webkit-scrollbar-thumb {\n  background: #00000033;\n  border: 2px solid rgba(0, 0, 0, 0);\n  background-clip: padding-box;\n  border-radius: 5px; }\n\n/* Handle on hover */\n\n::-webkit-scrollbar-thumb:hover {\n  background: #00000055;\n  background-clip: padding-box; }\n\n.fake-leaflet-control,\n.fake-leaflet-control-lg,\n.fake-leaflet-control-colours,\nbody .ui-sidebar,\n#layer-legends .legend,\n.layer-values-popup .leaflet-popup-content-wrapper,\n.layer-values-popup .leaflet-popup-tip,\n#simulation-play {\n  color: #333;\n  background: #fff;\n  border-radius: 4px;\n  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);\n  border: none;\n  background-clip: padding-box; }\n\n.fake-leaflet-control.active,\n.fake-leaflet-control-lg.active,\n.fake-leaflet-control-colours.active,\nbody .active.ui-sidebar,\n#layer-legends .active.legend,\n.layer-values-popup .active.leaflet-popup-content-wrapper,\n.layer-values-popup .active.leaflet-popup-tip,\n.active#simulation-play {\n  background-color: #007ad9;\n  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);\n  color: #ffffff; }\n\n.fake-leaflet-control,\n.fake-leaflet-control-lg {\n  margin-bottom: 10px;\n  position: relative; }\n\n.fake-leaflet-control {\n  height: 30px;\n  width: 30px; }\n\n.fake-leaflet-control-lg {\n  height: 44px;\n  width: 44px; }\n\n.fake-leaflet-control a,\n.fake-leaflet-control-lg a {\n  color: inherit;\n  height: 100%;\n  width: 100%;\n  display: block;\n  line-height: 0; }\n\n.fake-leaflet-control:hover,\n.fake-leaflet-control-lg:hover {\n  background-color: #f4f4f4; }\n\n.fake-leaflet-control a:hover,\n.fake-leaflet-control-lg a:hover {\n  color: #333;\n  cursor: pointer; }\n\n.fake-leaflet-control.active:hover,\n.fake-leaflet-control-lg.active:hover {\n  background-color: #1775bd; }\n\n.fake-leaflet-control.active a:hover,\n.fake-leaflet-control-lg.active a:hover,\n.fake-leaflet-control-colours.active a:hover,\nbody .active.ui-sidebar a:hover,\n#layer-legends .active.legend a:hover,\n.layer-values-popup .active.leaflet-popup-content-wrapper a:hover,\n.layer-values-popup .active.leaflet-popup-tip a:hover,\n.active#simulation-play a:hover {\n  color: #ffffff; }\n\n.fake-leaflet-control fa-icon.ng-fa-icon,\n.fake-leaflet-control-lg fa-icon.ng-fa-icon {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%); }\n\n.fake-leaflet-control a {\n  font-size: 12px; }\n\n.fake-leaflet-control-lg a {\n  font-size: 24px; }\n\n.fake-leaflet-control-lg span {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%); }\n\nbody .ui-sidebar {\n  z-index: 1400 !important;\n  transition: transform 0.3s cubic-bezier(0.455, 0.03, 0.515, 0.955);\n  padding: 0;\n  border-radius: 0; }\n\nbody .ui-sidebar-bottom {\n  box-shadow: 0 -8px 0px 2px rgba(0, 0, 0, 0.2); }\n\nbody .ui-sidebar-bottom,\nbody .ui-sidebar-top {\n  height: 320px; }\n\nbody .ui-sidebar-left,\nbody .ui-sidebar-right {\n  width: 313px; }\n\n.ui-sidebar.width-fit-content {\n  width: -webkit-fit-content;\n  width: -moz-fit-content;\n  width: fit-content; }\n\n.ui-sidebar.height-fit-content {\n  height: -webkit-fit-content;\n  height: -moz-fit-content;\n  height: fit-content; }\n\n.ui-sidebar.width-fit-content .sidebar-container {\n  min-width: 313px;\n  max-width: 100vw; }\n\n.sidebar-container {\n  height: calc(100% - 53px);\n  overflow-y: auto;\n  overflow-y: overlay;\n  -ms-overflow-style: -ms-autohiding-scrollbar;\n  overflow-x: hidden; }\n\n.sidebar-padding {\n  padding-top: 0.571em;\n  padding-right: 1em;\n  padding-bottom: 0.571em;\n  padding-left: 1em; }\n\n.sidebar-footer {\n  border-top: 1px solid #c8c8c8;\n  background: #f4f4f4; }\n\nbody .ui-sidebar .ui-sidebar-close {\n  padding-top: 0.571em;\n  padding-right: 1em;\n  padding-bottom: 0.571em;\n  padding-left: 1em;\n  float: none;\n  position: absolute;\n  right: 0;\n  top: 0; }\n\nbody .ui-sidebar h1 {\n  margin-bottom: 0;\n  margin-top: -8px;\n  padding-top: 23px;\n  padding-left: 15px;\n  padding-bottom: 0.67em;\n  padding-right: 100px;\n  background-color: #f4f4f4;\n  border-bottom: 1px solid #c8c8c8; }\n\n@media (min-width: 768px) {\n  body .sidebar-container .ui-orderlist-controls-right {\n    margin-right: -15px; } }\n\n.ui-state-highlight a.icon-toggle.default-col {\n  background-color: #0065b3; }\n\n/* Notes on z-index (in this order)\n1 = Leaflet\n\nGeowebMap Layers (Canvas, SVG...)\n\n500 = Geoweb/CSIRO Logo\n\n600 = Leaflet Layers (editable features - polygons...)\n\n650 = Leaflet tooltip (shows layer values on click)\n\n700 = Leaflet draw guides (graphical elements shown while drawing shapes)\n\n900 = Leaflet controls (buttons) + zoom controller\n\n1000 = Time slider\n\n\n1100 = File browser Dialog (so it is below drop upload...)\n\n1200 = Spinner\n\n1250 = File Drop Upload Component\n\n1300 = GeowebMap controls (config, start, log, connected status...)\n\n1350 = Chart sidebar\n\n1400 = Log Sidebar, Layer Sidebar, Config Sidebar\n\n1500 = Dialogs\n\n1900 = file upload spinner\n\n2000 = toast (message popups in top right corner) \n\n\n*/\n\na:hover {\n  color: #116fbf;\n  cursor: pointer; }\n\n#map-container {\n  overflow: hidden;\n  position: relative; }\n\n#map,\n#map-overlay,\n.svg-overlay {\n  height: calc(100vh);\n  width: 100vw; }\n\n.svg-overlay {\n  position: absolute;\n  pointer-events: none;\n  z-index: 500;\n  top: 0;\n  transform-origin: top left; }\n\n#layer-legends {\n  position: absolute;\n  right: -2px;\n  overflow-y: auto;\n  overflow-y: overlay;\n  -ms-overflow-style: -ms-autohiding-scrollbar;\n  touch-action: none;\n  pointer-events: none;\n  padding: 2px; }\n\n#layer-legends .legend {\n  box-sizing: content-box;\n  display: block;\n  float: right;\n  clear: both;\n  padding: 8px;\n  margin-bottom: 10px;\n  font-size: 14px; }\n\n#layer-legends .legend > g {\n    transform: translate(0, 14px); }\n\n#layer-legends .legend text {\n    fill: #333; }\n\n#layer-legends .legend .legendTitle {\n    font-weight: bold; }\n\n.disable-pointer {\n  pointer-events: none !important;\n  touch-action: none !important; }\n\n.leaflet-canvas-overlay,\n.leaflet-svg-overlay {\n  overflow: visible;\n  transform-origin: top left; }\n\n.leaflet-tile-pane,\n.leaflet-overlay-pane {\n  z-index: auto; }\n\n.leaflet-draw-guides {\n  position: absolute;\n  z-index: 700; }\n\n/* OVERRIDE LEAFLET zoom and fade animations */\n\n.leaflet-fade-anim .leaflet-tile {\n  will-change: opacity; }\n\n.leaflet-fade-anim .leaflet-popup {\n  opacity: 0;\n  transition: opacity 0.15s linear; }\n\n.leaflet-zoom-anim .leaflet-zoom-animated,\n.leaflet {\n  transition: transform 0.15s cubic-bezier(0, 0, 0.25, 1) !important; }\n\n.leaflet-zoom-anim .leaflet-canvas-overlay,\n.leaflet-zoom-anim .leaflet-svg-overlay {\n  transition: transform 0.15s cubic-bezier(0, 0, 0.25, 1); }\n\n.leaflet-fade-anim .leaflet-map-pane .leaflet-popup {\n  opacity: 1; }\n\n.leaflet-zoom-animated {\n  transform-origin: 0 0; }\n\n.leaflet-zoom-anim .leaflet-zoom-animated,\n.leaflet-canvas-overlay,\n.leaflet-svg-overlay {\n  will-change: transform; }\n\n.leaflet-zoom-anim .leaflet-tile,\n.leaflet-pan-anim .leaflet-tile {\n  transition: none; }\n\n.leaflet-zoom-anim .leaflet-zoom-hide {\n  visibility: hidden; }\n\n#svg-overlay.control,\n.control {\n  pointer-events: all; }\n\n.leaflet-top {\n  top: 50% !important;\n  transform: translateY(-50%); }\n\n#top-right-controls {\n  position: absolute;\n  right: 10px;\n  top: 10px;\n  z-index: 900;\n  transition: right 0.3s cubic-bezier(0.455, 0.03, 0.515, 0.955); }\n\n#bottom-right-controls {\n  position: absolute;\n  right: 10px;\n  bottom: 10px;\n  z-index: 900; }\n\n#top-right-controls.layer-sidebar-visble, #bottom-right-controls.layer-sidebar-visble, .legend-overlay.layer-sidebar-visble {\n  right: 325px; }\n\n#top-right-controls .fake-leaflet-control {\n  right: -14px; }\n\n#top-right-controls.hidden {\n  right: -60px; }\n\n#top-left-controls,\n#edit-feature-controller,\n#zoom-controller {\n  position: absolute;\n  left: 10px;\n  transition: left 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955); }\n\n#top-left-controls.hidden,\n#edit-feature-controller.hidden,\n#zoom-controller.hidden {\n  left: -60px; }\n\n#edit-feature-controller {\n  z-index: 999;\n  bottom: 0; }\n\n#edit-feature-controller .mapboxgl-ctrl.mapboxgl-ctrl-group {\n  margin: 0 0 10px 0;\n  float: left; }\n\n#top-left-controls {\n  z-index: 1300;\n  top: 10px; }\n\n#edit-feature-controller a:hover,\n#zoom-controller a:hover,\n.leaflet-control-layers-toggle {\n  cursor: pointer; }\n\n.mapboxgl-ctrl-group > button {\n  position: relative; }\n\n.map-logo {\n  position: absolute;\n  top: 6px;\n  left: 61px;\n  z-index: 500;\n  opacity: 0.5;\n  transition: opacity cubic-bezier(0.455, 0.03, 0.515, 0.955) 0.2s;\n  text-align: center;\n  text-align: center;\n  text-shadow: 0 0 3px white, 0 0 3px white, 0 0 3px white, 0 0 3px white;\n  font-size: 25px;\n  font-weight: 600; }\n\n.map-logo .map-logo-img {\n  height: 77px;\n  margin: auto;\n  display: block;\n  font-family: Roboto, \"Helvetica Neue\", Helvetica, Arial, sans-serif !important; }\n\n.map-logo:hover {\n  opacity: 0.7; }\n\n#timeline-controller {\n  position: absolute;\n  bottom: 10px;\n  left: 50%;\n  transform: translateX(-50%);\n  width: calc(100vw - 650px);\n  min-width: 500px;\n  max-width: 1000px;\n  height: auto;\n  font-size: 14px;\n  z-index: 1000;\n  transition: bottom 0.3s cubic-bezier(0.455, 0.03, 0.515, 0.955); }\n\n.timeline {\n  grid-template-columns: -webkit-min-content auto 164px;\n  grid-template-columns: min-content auto 164px;\n  display: grid;\n  padding: 5px; }\n\n.timeline.hidden {\n  bottom: -100px; }\n\n.timeline .ui-calendar-w-btn input.ui-inputtext {\n  width: calc(100% - 33px); }\n\n.time-slider-label {\n  white-space: nowrap;\n  display: flex;\n  align-items: center;\n  margin: 0 5px; }\n\n.time-slider {\n  transform: translate(0, 50%);\n  padding: 0 14px;\n  top: -1px;\n  position: relative; }\n\n.time-input {\n  width: 130px; }\n\n.leaflet-toolbar-0 {\n  width: 34px;\n  margin-bottom: 10px; }\n\n.leaflet-control-toolbar > li:first-child > .leaflet-toolbar-icon {\n  border-top-left-radius: 2px;\n  border-top-right-radius: 2px; }\n\n.leaflet-control-toolbar > li:last-child > .leaflet-toolbar-icon {\n  border-bottom-left-radius: 2px;\n  border-bottom-right-radius: 2px; }\n\n.leaflet-toolbar-icon-custom {\n  text-decoration: none !important;\n  color: #333 !important; }\n\n.leaflet-toolbar-icon-custom:hover {\n  color: #222 !important;\n  cursor: pointer; }\n\n.icon-toggle {\n  height: 100%;\n  width: 30px;\n  display: block;\n  float: right;\n  margin: -1px 0;\n  font-size: 16px;\n  text-align: center;\n  border-radius: 12px; }\n\n.icon-toggle:hover {\n  cursor: pointer; }\n\n.ui-state-highlight .icon-toggle.default-col {\n  color: #fff; }\n\n.ui-state-highlight .icon-toggle.default-col:hover {\n  color: #ffffffcc; }\n\n.ui-orderlist-item:not(.ui-state-highlight):hover a.icon-toggle.secondary-col {\n  background-color: #d2cfcf; }\n\n.ui-orderlist-item:not(.ui-state-highlight):hover a.icon-toggle.secondary-col:hover {\n  background-color: #c3c3c3; }\n\n.draw-fire-icon {\n  position: absolute;\n  top: 3px;\n  left: 7px; }\n\n.secondary-draw-fire-icon {\n  position: absolute;\n  color: #aaa;\n  top: 8px;\n  right: 6px;\n  font-size: 15px;\n  -webkit-filter: drop-shadow(-1px -1px 0px #fff);\n          filter: drop-shadow(-1px -1px 0px #fff); }\n\n.layer-sidebar-container .ui-widget-content.ui-orderlist-list {\n  min-height: 200px;\n  height: auto; }\n\n.layer-values-popup .mapboxgl-popup-content {\n  pointer-events: none; }\n\n.layer-values-popup .leaflet-popup-content-wrapper,\n.layer-values-popup .leaflet-popup-tip {\n  box-shadow: none; }\n\n.leaflet-popup-tip {\n  bottom: -18px;\n  border: none !important;\n  border-radius: 0;\n  -webkit-filter: drop-shadow(0px -2px 0px rgba(0, 0, 0, 0.2));\n  filter: drop-shadow(2px 2px 0px rgba(0, 0, 0, 0.2));\n  pointer-events: none; }\n\n.leaflet-popup-tip-container {\n  bottom: -18px; }\n\n.layer-values-popup .leaflet-popup-content-wrapper {\n  border-radius: 3px; }\n\n.layer-values-popup .leaflet-popup-content {\n  margin: 0;\n  padding: 12px; }\n\n.layer-values-popup p:not(:last-child) {\n  margin: 0 0 4px 0; }\n\n.layer-values-popup p:last-child {\n  margin: 0; }\n\n#chart-container {\n  padding: 0 10px 10px 10px; }\n\n#chart {\n  height: 250px; }\n\nbody .ui-sidebar.chart-sidebar {\n  background: rgba(255, 255, 255, 0.9);\n  z-index: 1350 !important;\n  margin: 0;\n  margin-bottom: -4px;\n  z-index: 1011;\n  width: calc(100vw - 650px);\n  min-width: 500px;\n  max-width: 1000px;\n  opacity: 1;\n  left: 50%;\n  transform: translate(-50%, 100%);\n  border-radius: 4px;\n  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);\n  transition: transform 0.3s cubic-bezier(0.455, 0.03, 0.515, 0.955); }\n\nbody .ui-sidebar.chart-sidebar.ui-sidebar-active {\n  transform: translate(-50%, 0); }\n\nbody .ui-sidebar.chart-sidebar h3 {\n  margin: 0;\n  padding-top: 10px;\n  text-align: center;\n  border-top-left-radius: 4px;\n  border-top-right-radius: 4px; }\n\n.mapboxgl-ctrl-bottom-left {\n  top: 50%;\n  bottom: unset;\n  left: 0;\n  transform: translate(0, -50%); }\n\n#simulation-play {\n  position: absolute;\n  bottom: 10px;\n  left: 50% !important;\n  transform: translateX(-50%);\n  text-align: center;\n  z-index: 1300;\n  padding: 5px 10px;\n  background-clip: padding-box;\n  font-size: 14px;\n  opacity: 70%; }\n\n#simulation-speed {\n  position: absolute;\n  bottom: 5px;\n  left: 50% !important;\n  z-index: 1400; }\n\n.legend-overlay {\n  position: absolute;\n  width: 6%;\n  bottom: 100px;\n  left: 0;\n  height: auto;\n  overflow: visible;\n  padding: 0 0 0 0;\n  margin: 0 0 0 0;\n  z-index: 100; }\n\n.legend-overlay .legend-overlay-inner {\n  color: rgba(17, 17, 17, 0.8);\n  padding: 0;\n  overflow: visible; }\n\n.legend-overlay-inner table td {\n  text-transform: capitalize; }\n\n.line_break {\n  padding: 0.5px;\n  border: none;\n  border-bottom: 1px solid gray; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYXdhbm1hY2Jvb2svRG9jdW1lbnRzL2Rzcy9jbGllbnQvc3JjL2FwcC9nZW8td2ViL3N0eWxlcy9mYWtlLWxlYWZsZXQtY29udHJvbC5zY3NzIiwiL1VzZXJzL3Bhd2FubWFjYm9vay9Eb2N1bWVudHMvZHNzL2NsaWVudC9zcmMvc3R5bGVzLnNjc3MiLCIvVXNlcnMvcGF3YW5tYWNib29rL0RvY3VtZW50cy9kc3MvY2xpZW50L3NyYy9hcHAvZ2VvLXdlYi9zdHlsZXMvc2lkZWJhci5zY3NzIiwiL1VzZXJzL3Bhd2FubWFjYm9vay9Eb2N1bWVudHMvZHNzL2NsaWVudC9zcmMvYXBwL2dlby13ZWIvbWFwL21hcC5jb21wb25lbnQuc2NzcyIsInNyYy9hcHAvZ2VvLXdlYi9tYXAvbWFwLmNvbXBvbmVudC5zY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OztFQUdFLFdBQVc7RUFDWCxnQkFBZ0I7RUFDaEIsa0JBQWtCO0VBQ2xCLHdDQUF3QztFQUN4QyxZQUFZO0VBQ1osNEJBQTRCLEVBQUE7O0FBRzlCOzs7Ozs7OztFQUdFLHlCQUF5QjtFQUN6Qiw4Q0FBOEM7RUFDOUMsY0FBYyxFQUFBOztBQUdoQjs7RUFFRSxtQkFBbUI7RUFDbkIsa0JBQWtCLEVBQUE7O0FBR3BCO0VBQ0UsWUFBWTtFQUNaLFdBQVcsRUFBQTs7QUFHYjtFQUNFLFlBQVk7RUFDWixXQUFXLEVBQUE7O0FBR2I7O0VBRUUsY0FBYztFQUNkLFlBQVk7RUFDWixXQUFXO0VBQ1gsY0FBYztFQUNkLGNBQWMsRUFBQTs7QUFHaEI7O0VBRUUseUJBQXlCLEVBQUE7O0FBRzNCOztFQUVFLFdBQVc7RUFDWCxlQUFlLEVBQUE7O0FBR2pCOztFQUVFLHlCQUF5QixFQUFBOztBQUczQjs7Ozs7Ozs7RUFHRSxjQUFjLEVBQUE7O0FBR2hCOztFQUVFLGtCQUFrQjtFQUNsQixRQUFRO0VBQ1IsU0FBUztFQUNULGdDQUFnQyxFQUFBOztBQUdsQztFQUNFLGVBQWUsRUFBQTs7QUFHakI7RUFDRSxlQUFlLEVBQUE7O0FBRWpCO0VBQ0Usa0JBQWtCO0VBQ2xCLFFBQVE7RUFDUixTQUFTO0VBQ1QsZ0NBQWdDLEVBQUE7O0FDckZsQztFQUNFLHNCQUFzQixFQUFBOztBQUd4Qjs7RUFFRSw4RUFBOEU7RUFDOUUsZUFBZTtFQUNmLFNBQVM7RUFDVCxVQUFVLEVBQUE7O0FBR1o7RUFDRSw4RUFBOEU7RUFDOUUsZUFBZSxFQUFBOztBQUdqQjs7RUFFRSxlQUFlO0VBQ2YsZ0JBQWdCLEVBQUE7O0FBR2xCOztFQUVFLGVBQWU7RUFDZixnQkFBZ0IsRUFBQTs7QUFPbEI7RUFDRSxzQkFBc0I7RUFDdEIsZ0JBQWdCO0VBQ2hCLHFCQUFxQjtFQUNyQiwwQkFBMEI7RUFDMUIsc0JBQXNCO0VBQ3RCLHdCQUF3QjtFQUN4QixxQkFBcUIsRUFBQTs7QUFHdkI7RUFDRSxnQkFBZ0I7RUFDaEIsa0JBQWtCLEVBQUE7O0FBR3BCO0VBQ0UsbUJBQW1CO0VBQ25CLGdCQUFnQjtFQUNoQix1QkFBdUIsRUFBQTs7QUFHekI7O0VBRUUsY0FBYztFQUNkLG1CQUFtQjtFQUNuQixnQkFBZ0IsRUFBQTs7QUFHbEI7RUFDRSxrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxtQkFBbUIsRUFBQTs7QUFHckI7RUFDRSxrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxpQkFBaUI7RUFDakIsY0FBYyxFQUFBOztBQUdoQjtFQUNFLG9DQUFvQztFQUNwQywyQkFBMkIsRUFBQTs7QUFHN0I7RUFDRSxjQUFjLEVBQUE7O0FBR2hCO0VBQ0UsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0UsV0FBVztFQUNYLGdCQUFnQjtFQUNoQixlQUFlO0VBQ2Ysa0JBQUE7RUFDQSxrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxpQkFBaUI7RUFDakIsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0Usc0JBQXNCLEVBQUE7O0FBR3hCO0VBQ0UsWUFBWSxFQUFBOztBQUlkO0VBQ0UsbUJBQW1CLEVBQUE7O0FBR3JCO0VBQ0UsK0JBQStCO0VBQy9CLGlCQUFpQixFQUFBOztBQUduQjtFQUNFLCtCQUErQjtFQUMvQixpQkFBaUI7RUFDakIsZ0JBQWdCO0VBQ2hCLG1CQUFtQjtFQUVuQiw0Q0FBNEM7RUFFNUMsaUJBQWlCO0VBQ2pCLGtCQUFrQixFQUFBOztBQUdwQjs7RUFFRSxpQkFBaUI7RUFDakIsa0JBQWtCLEVBQUE7O0FBR3BCO0VBQ0UsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0UsbUJBQW1CLEVBQUE7O0FBR3JCO0VBQ0UscUJBQXFCO0VBQ3JCLFdBQVc7RUFDWCxZQUFZO0VBQ1osZUFBZTtFQUNmLG1CQUFtQjtFQUNuQiwyQkFBMkIsRUFBQTs7QUFJN0I7RUFDRSxlQUFlO0VBQ2YsaUJBQWlCO0VBQ2pCLGNBQWMsRUFBQTs7QUFHaEI7RUFDRSxxQkFBcUIsRUFBQTs7QUFJdkI7Ozs7OztFQVVFLDhFQUE4RSxFQUFBOztBQUloRjs7O0VBR0UsY0FBYztFQUNkLHlCQUF5QjtFQUN6QixxQkFBcUIsRUFBQTs7QUFFdkI7OztFQUtFLHlCQUF5QjtFQUN6QixjQUFjO0VBQ2QscUJBQXFCLEVBQUE7O0FBR3ZCOzs7RUFPRSwrQkFBK0IsRUFBQTs7QUFFakM7OztFQUtFLHlCQUF5QjtFQUN6QixjQUFjO0VBQ2QscUJBQXFCLEVBQUE7O0FBRXZCOzs7RUFHRSxjQUFjO0VBQ2QseUJBQXlCO0VBQ3pCLHFCQUFxQixFQUFBOztBQUV2Qjs7O0VBR0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFFdkI7OztFQUtFLCtCQUErQixFQUFBOztBQUVqQzs7O0VBR0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFJdkI7OztFQUdFLGNBQWM7RUFDZCx5QkFBeUI7RUFDekIscUJBQXFCLEVBQUE7O0FBRXZCOzs7RUFLRSx5QkFBeUI7RUFDekIsY0FBYztFQUNkLHFCQUFxQixFQUFBOztBQUV2Qjs7O0VBT0UsK0JBQStCLEVBQUE7O0FBRWpDOzs7RUFLRSx5QkFBeUI7RUFDekIsY0FBYztFQUNkLHFCQUFxQixFQUFBOztBQUl2Qjs7O0VBR0UsY0FBYztFQUNkLHNCQUFzQjtFQUN0QixrQkFBa0IsRUFBQTs7QUFFcEI7OztFQUtFLHNCQUFzQjtFQUN0QixjQUFjO0VBQ2Qsa0JBQWtCLEVBQUE7O0FBRXBCOzs7RUFPRSwrQkFBK0IsRUFBQTs7QUFFakM7OztFQUtFLHNCQUFzQjtFQUN0QixjQUFjO0VBQ2Qsa0JBQWtCLEVBQUE7O0FBSXBCOzs7RUFHRSxjQUFjO0VBQ2QseUJBQXlCO0VBQ3pCLHFCQUFxQixFQUFBOztBQUV2Qjs7O0VBS0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFFdkI7OztFQU9FLCtCQUErQixFQUFBOztBQUVqQzs7O0VBS0UseUJBQXlCO0VBQ3pCLGNBQWM7RUFDZCxxQkFBcUIsRUFBQTs7QUFJdkI7OztFQUdFLGNBQWM7RUFDZCx5QkFBeUI7RUFDekIscUJBQXFCLEVBQUE7O0FBRXZCOzs7RUFLRSx5QkFBeUI7RUFDekIsY0FBYztFQUNkLHFCQUFxQixFQUFBOztBQUV2Qjs7O0VBT0UsK0JBQStCLEVBQUE7O0FBRWpDOzs7RUFLRSx5QkFBeUI7RUFDekIsY0FBYztFQUNkLHFCQUFxQixFQUFBOztBQUl2Qjs7O0VBR0UsY0FBYztFQUNkLHNCQUFzQjtFQUN0QixrQkFBa0IsRUFBQTs7QUFHcEI7O0VBRUUscUJBQXFCLEVBQUE7O0FBR3ZCOzs7RUFLRSxzQkFBc0I7RUFDdEIsY0FBYztFQUNkLGtCQUFrQixFQUFBOztBQUdwQjs7RUFJRSxxQkFBcUIsRUFBQTs7QUFHdkI7OztFQU9FLCtCQUErQixFQUFBOztBQUVqQzs7O0VBS0Usc0JBQXNCO0VBQ3RCLGNBQWM7RUFDZCxrQkFBa0IsRUFBQTs7QUFHcEI7O0VBSUUscUJBQXFCLEVBQUE7O0FBTXZCOztFQUVFLDhCQUE4QixFQUFBOztBQUdoQztFQUNFLG1EQUFtRCxFQUFBOztBQTdUckQ7RUFpVUUsMEJBQTBCLEVBQUE7O0FBN1Q1QjtFQWlVRSwwQkFBMEIsRUFBQTs7QUFJNUI7RUFDRSxZQUFZO0VBQ1osZ0JBQWdCO0VBQ2hCLFVBQVU7RUFDVixjQUFjO0VBQ2QsV0FBVztFQUVYLGlCQUFpQjtFQUdqQixjQUFjLEVBQUE7O0FBSWhCO0VBQ0Usd0JBQXVCO1VBQXZCLHVCQUF1QixFQUFBOztBQUl6Qjs7RUFFRSxxQkFBcUIsRUFBQTs7QUFJdkI7O0VBRUUsMkJBQTJCLEVBQUE7O0FBRzdCOzs7Ozs7Ozs7Ozs7OztFQWNFLCtCQUErQixFQUFBOztBQUlqQztFQUNFLHFEQUFxRCxFQUFBOztBQUd2RDtFQUNFLDZCQUE2QjtFQUM3QixrQkFBa0IsRUFBQTs7QUFHcEI7OztFQWFFLGdCQUFnQixFQUFBOztBQUlsQjtFQUNFLFdBQVcsRUFBQTs7QUFHYjs7RUFFRSxtQkFBbUIsRUFBQTs7QUFLckI7RUFDRSxtQkFBbUIsRUFBQTs7QUFHckI7O0VBRUUsV0FBVyxFQUFBOztBQUliO0VBQ0Usd0JBQXdCLEVBQUE7O0FBSTFCO0VBQ0UsY0FBYyxFQUFBOztBQURoQjtFQUtFLGVBQWUsRUFBQTs7QUFHakI7RUFDRSxtQkFBbUI7RUFDbkIsZUFBZSxFQUFBOztBQUdqQjtFQUNFLGVBQWUsRUFBQTs7QUFNakIsVUFBQTs7QUFDQTtFQUNFLFdBQVcsRUFBQTs7QUFHYixVQUFBOztBQUNBO0VBQ0UsZ0JBQWdCLEVBQUE7O0FBR2xCLFdBQUE7O0FBQ0E7RUFDRSxxQkFBcUI7RUFDckIsa0NBQWtDO0VBQ2xDLDRCQUE0QjtFQUM1QixrQkFBa0IsRUFBQTs7QUFHcEIsb0JBQUE7O0FBQ0E7RUFDRSxxQkFBcUI7RUFDckIsNEJBQTRCLEVBQUE7O0FEbG1COUI7Ozs7Ozs7O0VBR0UsV0FBVztFQUNYLGdCQUFnQjtFQUNoQixrQkFBa0I7RUFDbEIsd0NBQXdDO0VBQ3hDLFlBQVk7RUFDWiw0QkFBNEIsRUFBQTs7QUFHOUI7Ozs7Ozs7O0VBR0UseUJBQXlCO0VBQ3pCLDhDQUE4QztFQUM5QyxjQUFjLEVBQUE7O0FBR2hCOztFQUVFLG1CQUFtQjtFQUNuQixrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxZQUFZO0VBQ1osV0FBVyxFQUFBOztBQUdiO0VBQ0UsWUFBWTtFQUNaLFdBQVcsRUFBQTs7QUFHYjs7RUFFRSxjQUFjO0VBQ2QsWUFBWTtFQUNaLFdBQVc7RUFDWCxjQUFjO0VBQ2QsY0FBYyxFQUFBOztBQUdoQjs7RUFFRSx5QkFBeUIsRUFBQTs7QUFHM0I7O0VBRUUsV0FBVztFQUNYLGVBQWUsRUFBQTs7QUFHakI7O0VBRUUseUJBQXlCLEVBQUE7O0FBRzNCOzs7Ozs7OztFQUdFLGNBQWMsRUFBQTs7QUFHaEI7O0VBRUUsa0JBQWtCO0VBQ2xCLFFBQVE7RUFDUixTQUFTO0VBQ1QsZ0NBQWdDLEVBQUE7O0FBR2xDO0VBQ0UsZUFBZSxFQUFBOztBQUdqQjtFQUNFLGVBQWUsRUFBQTs7QUFFakI7RUFDRSxrQkFBa0I7RUFDbEIsUUFBUTtFQUNSLFNBQVM7RUFDVCxnQ0FBZ0MsRUFBQTs7QUVsRmxDO0VBRUUsd0JBQXdCO0VBQ3hCLGtFQUFrRTtFQUNsRSxVQUFVO0VBQ1YsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0UsNkNBQTZDLEVBQUE7O0FBRy9DOztFQUVFLGFBQWEsRUFBQTs7QUFHZjs7RUFFRSxZQUFZLEVBQUE7O0FBR2Q7RUFDRSwwQkFBa0I7RUFBbEIsdUJBQWtCO0VBQWxCLGtCQUFrQixFQUFBOztBQUdwQjtFQUNFLDJCQUFtQjtFQUFuQix3QkFBbUI7RUFBbkIsbUJBQW1CLEVBQUE7O0FBR3JCO0VBQ0UsZ0JBQWdCO0VBQ2hCLGdCQUFnQixFQUFBOztBQUlsQjtFQUNFLHlCQUF5QjtFQUN6QixnQkFBZ0I7RUFDaEIsbUJBQW1CO0VBQ25CLDRDQUE0QztFQUM1QyxrQkFBa0IsRUFBQTs7QUFHcEI7RUFDRSxvQkFBb0I7RUFDcEIsa0JBQWtCO0VBQ2xCLHVCQUF1QjtFQUN2QixpQkFBaUIsRUFBQTs7QUFHbkI7RUFDRSw2QkFBNkI7RUFDN0IsbUJBQW1CLEVBQUE7O0FBR3JCO0VBQ0Usb0JBQW9CO0VBQ3BCLGtCQUFrQjtFQUNsQix1QkFBdUI7RUFDdkIsaUJBQWlCO0VBQ2pCLFdBQVc7RUFDWCxrQkFBa0I7RUFDbEIsUUFBUTtFQUNSLE1BQU0sRUFBQTs7QUFHUjtFQUNFLGdCQUFnQjtFQUNoQixnQkFBZ0I7RUFDaEIsaUJBQWlCO0VBQ2pCLGtCQUFrQjtFQUNsQixzQkFBc0I7RUFDdEIsb0JBQW9CO0VBQ3BCLHlCQUF5QjtFQUN6QixnQ0FBZ0MsRUFBQTs7QUFHbEM7RUFDRTtJQUNFLG1CQUFtQixFQUFBLEVBQ3BCOztBQXFCSDtFQUNFLHlCQUF5QixFQUFBOztBQ3ZHM0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0N1dUJDOztBRGhzQkQ7RUFDRSxjQUFjO0VBQ2QsZUFBZSxFQUFBOztBQUdqQjtFQUNFLGdCQUFnQjtFQUNoQixrQkFBa0IsRUFBQTs7QUFHcEI7OztFQUdFLG1CQUFtQjtFQUNuQixZQUFZLEVBQUE7O0FBR2Q7RUFDRSxrQkFBa0I7RUFDbEIsb0JBQW9CO0VBQ3BCLFlBQVk7RUFDWixNQUFNO0VBQ04sMEJBQTBCLEVBQUE7O0FBRzVCO0VBQ0Usa0JBQWtCO0VBQ2xCLFdBQVc7RUFDWCxnQkFBZ0I7RUFDaEIsbUJBQW1CO0VBQ25CLDRDQUE0QztFQUM1QyxrQkFBa0I7RUFDbEIsb0JBQW9CO0VBQ3BCLFlBQVksRUFBQTs7QUFHZDtFQUVFLHVCQUF1QjtFQUV2QixjQUFjO0VBQ2QsWUFBWTtFQUNaLFdBQVc7RUFFWCxZQUFZO0VBQ1osbUJBQW1CO0VBRW5CLGVBQWUsRUFBQTs7QUFYakI7SUFjSSw2QkFBNkIsRUFBQTs7QUFkakM7SUFrQkksVUFBVSxFQUFBOztBQWxCZDtJQXNCSSxpQkFBaUIsRUFBQTs7QUFJckI7RUFDRSwrQkFBK0I7RUFDL0IsNkJBQTZCLEVBQUE7O0FBRy9COztFQUVFLGlCQUFpQjtFQUNqQiwwQkFBMEIsRUFBQTs7QUFJNUI7O0VBRUUsYUFBYSxFQUFBOztBQUlmO0VBQ0Usa0JBQWtCO0VBQ2xCLFlBQVksRUFBQTs7QUFHZCw4Q0FBQTs7QUFFQTtFQUNFLG9CQUFvQixFQUFBOztBQUd0QjtFQUNFLFVBQVU7RUFDVixnQ0FBZ0MsRUFBQTs7QUFHbEM7O0VBRUUsa0VBQWtFLEVBQUE7O0FBR3BFOztFQUVFLHVEQUF1RCxFQUFBOztBQUd6RDtFQUNFLFVBQVUsRUFBQTs7QUFHWjtFQUVFLHFCQUFxQixFQUFBOztBQUd2Qjs7O0VBR0Usc0JBQXNCLEVBQUE7O0FBR3hCOztFQUVFLGdCQUFnQixFQUFBOztBQUdsQjtFQUNFLGtCQUFrQixFQUFBOztBQUlwQjs7RUFFRSxtQkFBbUIsRUFBQTs7QUFJckI7RUFDRSxtQkFBbUI7RUFDbkIsMkJBQTJCLEVBQUE7O0FBRzdCO0VBQ0Usa0JBQWtCO0VBQ2xCLFdBQVc7RUFDWCxTQUFTO0VBQ1QsWUFBWTtFQUNaLDhEQUE4RCxFQUFBOztBQUloRTtFQUNFLGtCQUFrQjtFQUNsQixXQUFXO0VBQ1gsWUFBWTtFQUNaLFlBQVksRUFBQTs7QUFJZDtFQUNFLFlBQVksRUFBQTs7QUFJZDtFQUNFLFlBQVksRUFBQTs7QUFHZDtFQUNFLFlBQVksRUFBQTs7QUFHZDs7O0VBR0Usa0JBQWtCO0VBQ2xCLFVBQVU7RUFDViw2REFBNkQsRUFBQTs7QUFHL0Q7OztFQUdFLFdBQVcsRUFBQTs7QUFHYjtFQUNFLFlBQVk7RUFDWixTQUFTLEVBQUE7O0FBR1g7RUFDRSxrQkFBa0I7RUFDbEIsV0FBVyxFQUFBOztBQUdiO0VBQ0UsYUFBYTtFQUNiLFNBQVMsRUFBQTs7QUFHWDs7O0VBR0UsZUFBZSxFQUFBOztBQUdqQjtFQUNFLGtCQUFrQixFQUFBOztBQUdwQjtFQUNFLGtCQUFrQjtFQUNsQixRQUFRO0VBQ1IsVUFBVTtFQUNWLFlBQVk7RUFDWixZQUFZO0VBQ1osZ0VBQWdFO0VBQ2hFLGtCQUFrQjtFQUNsQixrQkFBa0I7RUFDbEIsdUVBQXVFO0VBQ3ZFLGVBQWU7RUFDZixnQkFBZ0IsRUFBQTs7QUFNbEI7RUFDRSxZQUFZO0VBQ1osWUFBWTtFQUNaLGNBQWM7RUFDZCw4RUFBOEUsRUFBQTs7QUFPaEY7RUFDRSxZQUFZLEVBQUE7O0FBR2Q7RUFDRSxrQkFBa0I7RUFDbEIsWUFBWTtFQUNaLFNBQVM7RUFDVCwyQkFBMkI7RUFDM0IsMEJBQTBCO0VBQzFCLGdCQUFnQjtFQUNoQixpQkFBaUI7RUFDakIsWUFBWTtFQUVaLGVBQWU7RUFDZixhQUFhO0VBRWIsK0RBQStELEVBQUE7O0FBR2pFO0VBQ0UscURBQTZDO0VBQTdDLDZDQUE2QztFQUM3QyxhQUFhO0VBQ2IsWUFBWSxFQUFBOztBQUdkO0VBQ0UsY0FBYyxFQUFBOztBQUdoQjtFQUNFLHdCQUF3QixFQUFBOztBQUcxQjtFQUNFLG1CQUFtQjtFQUNuQixhQUFhO0VBQ2IsbUJBQW1CO0VBQ25CLGFBQWEsRUFBQTs7QUFHZjtFQUNFLDRCQUE0QjtFQUM1QixlQUFlO0VBQ2YsU0FBUztFQUNULGtCQUFrQixFQUFBOztBQUdwQjtFQUNFLFlBQVksRUFBQTs7QUFHZDtFQUNFLFdBQVc7RUFDWCxtQkFBbUIsRUFBQTs7QUFHckI7RUFDRSwyQkFBMkI7RUFDM0IsNEJBQTRCLEVBQUE7O0FBRzlCO0VBQ0UsOEJBQThCO0VBQzlCLCtCQUErQixFQUFBOztBQUdqQztFQUNFLGdDQUFnQztFQUNoQyxzQkFBc0IsRUFBQTs7QUFHeEI7RUFDRSxzQkFBc0I7RUFDdEIsZUFBZSxFQUFBOztBQUdqQjtFQUNFLFlBQVk7RUFDWixXQUFXO0VBQ1gsY0FBYztFQUNkLFlBQVk7RUFDWixjQUFjO0VBQ2QsZUFBZTtFQUNmLGtCQUFrQjtFQUNsQixtQkFBbUIsRUFBQTs7QUFHckI7RUFDRSxlQUFlLEVBQUE7O0FBSWpCO0VBQ0UsV0FBVyxFQUFBOztBQUdiO0VBQ0UsZ0JBQWdCLEVBQUE7O0FBR2xCO0VBQ0UseUJBQXlCLEVBQUE7O0FBRzNCO0VBRUUseUJBQXlCLEVBQUE7O0FBRzNCO0VBQ0Usa0JBQWtCO0VBQ2xCLFFBQVE7RUFDUixTQUFTLEVBQUE7O0FBR1g7RUFDRSxrQkFBa0I7RUFDbEIsV0FBVztFQUNYLFFBQVE7RUFDUixVQUFVO0VBQ1YsZUFBZTtFQUNmLCtDQUF1QztVQUF2Qyx1Q0FBdUMsRUFBQTs7QUFHekM7RUFDRSxpQkFBaUI7RUFDakIsWUFBWSxFQUFBOztBQUdkO0VBQ0Usb0JBQW9CLEVBQUE7O0FBSXRCOztFQUdFLGdCQUFnQixFQUFBOztBQUdsQjtFQUNFLGFBQWE7RUFDYix1QkFBdUI7RUFDdkIsZ0JBQWdCO0VBQ2hCLDREQUE0RDtFQUM1RCxtREFBbUQ7RUFDbkQsb0JBQW9CLEVBQUE7O0FBR3RCO0VBQ0UsYUFBYSxFQUFBOztBQUdmO0VBQ0Usa0JBQWtCLEVBQUE7O0FBR3BCO0VBQ0UsU0FBUztFQUNULGFBQWEsRUFBQTs7QUFHZjtFQUNFLGlCQUFpQixFQUFBOztBQUduQjtFQUNFLFNBQVMsRUFBQTs7QUFHWDtFQUNFLHlCQUF5QixFQUFBOztBQUczQjtFQUNFLGFBQWEsRUFBQTs7QUFHZjtFQUNFLG9DQUFvQztFQUNwQyx3QkFBd0I7RUFDeEIsU0FBUztFQUNULG1CQUFtQjtFQUNuQixhQUFhO0VBQ2IsMEJBQTBCO0VBQzFCLGdCQUFnQjtFQUNoQixpQkFBaUI7RUFDakIsVUFBVTtFQUNWLFNBQVM7RUFDVCxnQ0FBZ0M7RUFDaEMsa0JBQWtCO0VBQ2xCLHdDQUF3QztFQUN4QyxrRUFBa0UsRUFBQTs7QUFHcEU7RUFDRSw2QkFBNkIsRUFBQTs7QUFHL0I7RUFDRSxTQUFTO0VBQ1QsaUJBQWlCO0VBQ2pCLGtCQUFrQjtFQUNsQiwyQkFBMkI7RUFDM0IsNEJBQTRCLEVBQUE7O0FBRzlCO0VBQ0UsUUFBUTtFQUNSLGFBQWE7RUFDYixPQUFPO0VBQ1AsNkJBQTZCLEVBQUE7O0FBRS9CO0VBRUUsa0JBQWtCO0VBQ2xCLFlBQVk7RUFDWixvQkFBb0I7RUFDcEIsMkJBQTJCO0VBQzNCLGtCQUFrQjtFQUNsQixhQUFhO0VBQ2IsaUJBQWlCO0VBQ2pCLDRCQUE0QjtFQUM1QixlQUFlO0VBQ2YsWUFBWSxFQUFBOztBQUVkO0VBQ0Usa0JBQWtCO0VBQ2xCLFdBQVc7RUFDWCxvQkFBb0I7RUFDcEIsYUFBYSxFQUFBOztBQUVmO0VBQ0Usa0JBQWtCO0VBQ2xCLFNBQVM7RUFDVCxhQUFhO0VBQ2IsT0FBTztFQUNQLFlBQVk7RUFDWixpQkFBaUI7RUFDakIsZ0JBQWdCO0VBQ2hCLGVBQWU7RUFDZixZQUFZLEVBQUE7O0FBSWQ7RUFDRSw0QkFBNEI7RUFDNUIsVUFBVTtFQUNWLGlCQUFpQixFQUFBOztBQUduQjtFQUNFLDBCQUEwQixFQUFBOztBQUU1QjtFQUNFLGNBQWM7RUFDZCxZQUFZO0VBQ1osNkJBQTZCLEVBQUEiLCJmaWxlIjoic3JjL2FwcC9nZW8td2ViL21hcC9tYXAuY29tcG9uZW50LnNjc3MiLCJzb3VyY2VzQ29udGVudCI6WyIuZmFrZS1sZWFmbGV0LWNvbnRyb2wsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtY29sb3VycyB7XG4gIGNvbG9yOiAjMzMzO1xuICBiYWNrZ3JvdW5kOiAjZmZmO1xuICBib3JkZXItcmFkaXVzOiA0cHg7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDJweCByZ2JhKDAsIDAsIDAsIDAuMSk7XG4gIGJvcmRlcjogbm9uZTtcbiAgYmFja2dyb3VuZC1jbGlwOiBwYWRkaW5nLWJveDtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLmFjdGl2ZSxcbi5mYWtlLWxlYWZsZXQtY29udHJvbC1sZy5hY3RpdmUsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtY29sb3Vycy5hY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3YWQ5O1xuICBib3gtc2hhZG93OiAwIDAgMCAycHggcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICBjb2xvcjogI2ZmZmZmZjtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIHtcbiAgbWFyZ2luLWJvdHRvbTogMTBweDtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wge1xuICBoZWlnaHQ6IDMwcHg7XG4gIHdpZHRoOiAzMHB4O1xufVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcge1xuICBoZWlnaHQ6IDQ0cHg7XG4gIHdpZHRoOiA0NHB4O1xufVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wgYSxcbi5mYWtlLWxlYWZsZXQtY29udHJvbC1sZyBhIHtcbiAgY29sb3I6IGluaGVyaXQ7XG4gIGhlaWdodDogMTAwJTtcbiAgd2lkdGg6IDEwMCU7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBsaW5lLWhlaWdodDogMDtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sOmhvdmVyLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2Y0ZjRmNDtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sIGE6aG92ZXIsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcgYTpob3ZlciB7XG4gIGNvbG9yOiAjMzMzO1xuICBjdXJzb3I6IHBvaW50ZXI7XG59XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbC5hY3RpdmU6aG92ZXIsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcuYWN0aXZlOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzE3NzViZDtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLmFjdGl2ZSBhOmhvdmVyLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnLmFjdGl2ZSBhOmhvdmVyLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWNvbG91cnMuYWN0aXZlIGE6aG92ZXIge1xuICBjb2xvcjogI2ZmZmZmZjtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sIGZhLWljb24ubmctZmEtaWNvbixcbi5mYWtlLWxlYWZsZXQtY29udHJvbC1sZyBmYS1pY29uLm5nLWZhLWljb24ge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogNTAlO1xuICBsZWZ0OiA1MCU7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpO1xufVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wgYSB7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIGEge1xuICBmb250LXNpemU6IDI0cHg7XG59XG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcgc3BhbiB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgdG9wOiA1MCU7XG4gIGxlZnQ6IDUwJTtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7XG59XG4iLCIqIHtcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbn1cblxuYm9keSxcbmh0bWwge1xuICBmb250LWZhbWlseTogUm9ib3RvLCBcIkhlbHZldGljYSBOZXVlXCIsIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWYgIWltcG9ydGFudDtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBtYXJnaW46IDA7XG4gIHBhZGRpbmc6IDA7XG59XG5cbi5jMyB0ZXh0IHtcbiAgZm9udC1mYW1pbHk6IFJvYm90bywgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmICFpbXBvcnRhbnQ7XG4gIGZvbnQtc2l6ZTogMTRweDtcbn1cblxuaDEsXG4uaDEge1xuICBmb250LXNpemU6IDI0cHg7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG59XG5cbmgyLFxuLmgyIHtcbiAgZm9udC1zaXplOiAxOHB4O1xuICBmb250LXdlaWdodDogNTAwO1xufVxuXG5oMyxcbi5oMyB7XG59XG5cbnByZSB7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7XG4gIG92ZXJmbG93LXg6IGF1dG87XG4gIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbiAgd2hpdGUtc3BhY2U6IC1tb3otcHJlLXdyYXA7XG4gIHdoaXRlLXNwYWNlOiAtcHJlLXdyYXA7XG4gIHdoaXRlLXNwYWNlOiAtby1wcmUtd3JhcDtcbiAgd29yZC13cmFwOiBicmVhay13b3JkO1xufVxuXG4uZm9udC1pdGFsaWMtbGlnaHQge1xuICBmb250LXdlaWdodDogMTAwO1xuICBmb250LXN0eWxlOiBpdGFsaWM7XG59XG5cbi50ZXh0LW92ZXJmbG93LWVsbGlwc2lzIHtcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG59XG5cbi5sYWJlbCxcbmxhYmVsIHtcbiAgZGlzcGxheTogYmxvY2s7XG4gIG1hcmdpbi1ib3R0b206IDEwcHg7XG4gIG1hcmdpbi10b3A6IDIwcHg7XG59XG5cbi5iYWRnZSA+IC5waSB7XG4gIHBhZGRpbmctcmlnaHQ6IDRweDtcbn1cblxuYS5pY29uLWxpbms6bGFzdC1vZi10eXBlIHtcbiAgcGFkZGluZy1yaWdodDogMTBweDtcbn1cblxuYS5pY29uLWxpbms6Zmlyc3Qtb2YtdHlwZSB7XG4gIHBhZGRpbmctbGVmdDogMTBweDtcbn1cblxuYS5pY29uLWxpbmsge1xuICBmb250LXNpemU6IDAuODVlbTtcbiAgcGFkZGluZzogMCA1cHg7XG59XG5cbmJvZHkgLnVpLXdpZGdldC1vdmVybGF5IHtcbiAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAwLCAwLCAwLjIpO1xuICB0cmFuc2l0aW9uOiBhbGwgbGluZWFyIDAuMnM7XG59XG5cbi51aS1zdGF0ZS1oaWdobGlnaHQgYS5pY29uLWxpbmsge1xuICBjb2xvcjogI2ZmZmZmZjtcbn1cblxuLnVpLXN0YXRlLWhpZ2hsaWdodCBhLmljb24tbGluazpob3ZlciB7XG4gIGNvbG9yOiAjZmZmZmZmYmE7XG59XG5cbi5lbXB0eS1wbGFjZWhvbGRlciB7XG4gIGNvbG9yOiAjOTk5O1xuICBmb250LXdlaWdodDogMTAwO1xuICBwYWRkaW5nOiAyMHB4IDA7XG4gIC8qIGhlaWdodDogMTAwJTsgKi9cbiAgdGV4dC1hbGlnbjogY2VudGVyO1xufVxuXG4udWktdG9hc3Qge1xuICBtYXgtaGVpZ2h0OiAxMDB2aDtcbiAgb3ZlcmZsb3cteTogYXV0bztcbn1cblxuLnVpLXRvYXN0LWRldGFpbCB7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7XG59XG5cbi5tb2RhbC1kaWFsb2cudWktZGlhbG9nIHtcbiAgd2lkdGg6IDQwMHB4O1xufVxuXG4vLyBBZGQgYm90dG9tIG1hcmdpbiB0byByb3dzIGluIGRpYWxvZ3Ncbi51aS1kaWFsb2cgLnVpLWdyaWQgLnVpLWdyaWQtcm93IHtcbiAgbWFyZ2luLWJvdHRvbTogMTBweDtcbn1cblxuLnVpLWRpYWxvZyAudWktbGlzdGJveCAudWktbGlzdGJveC1saXN0LXdyYXBwZXIge1xuICBtYXgtaGVpZ2h0OiBjYWxjKDEwMHZoIC0gNDAwcHgpO1xuICBtaW4taGVpZ2h0OiAxMDBweDtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctY29udGVudCB7XG4gIG1heC1oZWlnaHQ6IGNhbGMoMTAwdmggLSAyMDBweCk7XG4gIG1pbi1oZWlnaHQ6IDIwMHB4O1xuICBvdmVyZmxvdy15OiBhdXRvO1xuICBvdmVyZmxvdy15OiBvdmVybGF5O1xuXG4gIC1tcy1vdmVyZmxvdy1zdHlsZTogLW1zLWF1dG9oaWRpbmctc2Nyb2xsYmFyO1xuXG4gIGJvcmRlci1sZWZ0OiBub25lO1xuICBib3JkZXItcmlnaHQ6IG5vbmU7XG59XG5cbmJvZHkgLnVpLWRpYWxvZyAudWktZGlhbG9nLXRpdGxlYmFyLFxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctZm9vdGVyIHtcbiAgYm9yZGVyLWxlZnQ6IG5vbmU7XG4gIGJvcmRlci1yaWdodDogbm9uZTtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXIge1xuICBib3JkZXItdG9wOiBub25lO1xufVxuXG5ib2R5IC51aS1kaWFsb2cgLnVpLWRpYWxvZy1mb290ZXIge1xuICBib3JkZXItYm90dG9tOiBub25lO1xufVxuXG4udWktZGlhbG9nIC51aS1saXN0Ym94IC51aS1wcm9ncmVzc2JhciB7XG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTRweDtcbiAgbWFyZ2luLXRvcDogM3B4O1xuICBtYXJnaW4tYm90dG9tOiAtM3B4O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwMDAwNGE7XG59XG5cbi8vIFByb2dyZXNzIGJhciBpbiBsaXN0Ym94IGluIGRpYWxvZ3Ncbi51aS1kaWFsb2cgLnVpLWxpc3Rib3ggLnVpLXByb2dyZXNzYmFyIC51aS1wcm9ncmVzc2Jhci1sYWJlbCB7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgbGluZS1oZWlnaHQ6IDEuMjU7XG4gIGNvbG9yOiBpbmhlcml0O1xufVxuXG4udWktZGlhbG9nIC51aS1saXN0Ym94IC51aS1wcm9ncmVzc2JhciAudWktcHJvZ3Jlc3NiYXItdmFsdWUge1xuICBiYWNrZ3JvdW5kOiAjMDAwMDAwNmI7XG59XG5cbi8vIE92ZXJ3cml0ZSBQcmltZU5HIGZvbnRzXG5ib2R5IC51aS13aWRnZXQsXG5ib2R5XG4gIC51aS1hdXRvY29tcGxldGUudWktYXV0b2NvbXBsZXRlLW11bHRpcGxlXG4gIC51aS1hdXRvY29tcGxldGUtbXVsdGlwbGUtY29udGFpbmVyXG4gIC51aS1hdXRvY29tcGxldGUtaW5wdXQtdG9rZW5cbiAgaW5wdXQsXG5ib2R5IC51aS1jaGlwcyA+IHVsLnVpLWlucHV0dGV4dCAudWktY2hpcHMtaW5wdXQtdG9rZW4gaW5wdXQsXG5ib2R5IC51aS10YWJsZSAudWktZWRpdGFibGUtY29sdW1uIGlucHV0LFxuYm9keSAudWktdHJlZXRhYmxlIC51aS1lZGl0YWJsZS1jb2x1bW4gaW5wdXQsXG5ib2R5IC51aS10ZXJtaW5hbCAudWktdGVybWluYWwtaW5wdXQge1xuICBmb250LWZhbWlseTogUm9ib3RvLCBcIkhlbHZldGljYSBOZXVlXCIsIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWYgIWltcG9ydGFudDtcbn1cblxuLy8gT3ZlcndyaXRlIFByaW1lTmcgY29sb3Vyc1xuYm9keSAuc2Vjb25kYXJ5LWNvbCxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zZWNvbmRhcnksXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLXNlY29uZGFyeSA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdCB7XG4gIGNvbG9yOiAjMzMzMzMzO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZThlOGU4O1xuICBib3JkZXItY29sb3I6ICNlOGU4ZTg7XG59XG5ib2R5IC5zZWNvbmRhcnktY29sOmhvdmVyLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXNlY29uZGFyeTplbmFibGVkOmhvdmVyLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zZWNvbmRhcnlcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNjOGM4Yzg7XG4gIGNvbG9yOiAjMzMzMzMzO1xuICBib3JkZXItY29sb3I6ICNjOGM4Yzg7XG59XG4vLyBDb2xvdXJzIGZyb20gUHJpbWVOR1xuYm9keSAuc2Vjb25kYXJ5LWNvbDplbmFibGVkOmZvY3VzLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXNlY29uZGFyeTplbmFibGVkOmZvY3VzLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zZWNvbmRhcnlcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpmb2N1cyB7XG4gIC13ZWJraXQtYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gIzhkY2RmZjtcbiAgLW1vei1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjOGRjZGZmO1xuICBib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjOGRjZGZmO1xufVxuYm9keSAuc2Vjb25kYXJ5LWNvbDphY3RpdmUsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc2Vjb25kYXJ5OmVuYWJsZWQ6YWN0aXZlLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zZWNvbmRhcnlcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjYTBhMGEwO1xuICBjb2xvcjogIzMzMzMzMztcbiAgYm9yZGVyLWNvbG9yOiAjYTBhMGEwO1xufVxuYm9keSAuZGVmYXVsdC1jb2wsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24taW5mbyxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24taW5mbyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdCB7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3YWQ5O1xuICBib3JkZXItY29sb3I6ICMwMDdhZDk7XG59XG5ib2R5IC5kZWZhdWx0LWNvbDpob3ZlcixcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1pbmZvOmVuYWJsZWQ6aG92ZXIsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWluZm8gPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICMxMTZmYmY7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBib3JkZXItY29sb3I6ICMxMTZmYmY7XG59XG5ib2R5IC5kZWZhdWx0LWNvbDplbmFibGVkOmZvY3VzLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWluZm86ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24taW5mbyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjOGRjZGZmO1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICM4ZGNkZmY7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICM4ZGNkZmY7XG59XG5ib2R5IC5kZWZhdWx0LWNvbDphY3RpdmUsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24taW5mbzplbmFibGVkOmFjdGl2ZSxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24taW5mbyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmFjdGl2ZSB7XG4gIGJhY2tncm91bmQtY29sb3I6ICMwMDViOWY7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBib3JkZXItY29sb3I6ICMwMDViOWY7XG59XG5cbi8vIFNVY2Nlc3MgY29sXG5ib2R5IC5zdWNjZXNzLWNvbCxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zdWNjZXNzLFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zdWNjZXNzID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0IHtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJhY2tncm91bmQtY29sb3I6ICMzNGE4MzU7XG4gIGJvcmRlci1jb2xvcjogIzM0YTgzNTtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sOmhvdmVyLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3M6ZW5hYmxlZDpob3ZlcixcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2Vzc1xuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzEwN2QxMTtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogIzEwN2QxMTtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc3VjY2VzczplbmFibGVkOmZvY3VzLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zdWNjZXNzXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6Zm9jdXMge1xuICAtd2Via2l0LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNhYWU1YWE7XG4gIC1tb3otYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2FhZTVhYTtcbiAgYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2FhZTVhYTtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sOmFjdGl2ZSxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zdWNjZXNzOmVuYWJsZWQ6YWN0aXZlLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zdWNjZXNzXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6YWN0aXZlIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzBjNmIwZDtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogIzBjNmIwZDtcbn1cblxuLy8gU1VjY2VzcyBvdXRsaW5lXG5ib2R5IC5zdWNjZXNzLWNvbC1vdXRsaW5lLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZSxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0IHtcbiAgY29sb3I6ICMzNGE4MzU7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGJvcmRlci1jb2xvcjogI2ZmZjtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sLW91dGxpbmU6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lOmVuYWJsZWQ6aG92ZXIsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZVxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgY29sb3I6ICMxMDdkMTE7XG4gIGJvcmRlci1jb2xvcjogI2ZmZjtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sLW91dGxpbmU6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zdWNjZXNzLW91dGxpbmU6ZW5hYmxlZDpmb2N1cyxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6Zm9jdXMge1xuICAtd2Via2l0LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNhYWU1YWE7XG4gIC1tb3otYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2FhZTVhYTtcbiAgYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2FhZTVhYTtcbn1cbmJvZHkgLnN1Y2Nlc3MtY29sLW91dGxpbmU6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZTplbmFibGVkOmFjdGl2ZSxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6YWN0aXZlIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgY29sb3I6ICMwYzZiMGQ7XG4gIGJvcmRlci1jb2xvcjogI2ZmZjtcbn1cblxuLy8gV2FybmluZyBjb2xcbmJvZHkgLndhcm5pbmctY29sLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXdhcm5pbmcsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLXdhcm5pbmcgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogIzMzMzMzMztcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmYmEwMTtcbiAgYm9yZGVyLWNvbG9yOiAjZmZiYTAxO1xufVxuYm9keSAud2FybmluZy1jb2w6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24td2FybmluZzplbmFibGVkOmhvdmVyLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi13YXJuaW5nXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZWQ5OTBiO1xuICBjb2xvcjogIzMzMzMzMztcbiAgYm9yZGVyLWNvbG9yOiAjZWQ5OTBiO1xufVxuYm9keSAud2FybmluZy1jb2w6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi13YXJuaW5nOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLXdhcm5pbmdcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpmb2N1cyB7XG4gIC13ZWJraXQtYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2ZmZWFiNDtcbiAgLW1vei1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZmZlYWI0O1xuICBib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZmZlYWI0O1xufVxuYm9keSAud2FybmluZy1jb2w6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXdhcm5pbmc6ZW5hYmxlZDphY3RpdmUsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLXdhcm5pbmdcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZDM4YjEwO1xuICBjb2xvcjogIzMzMzMzMztcbiAgYm9yZGVyLWNvbG9yOiAjZDM4YjEwO1xufVxuXG4vLyBEYW5nZXIgY29sb3VyXG5ib2R5IC5kYW5nZXItY29sLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlcixcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0IHtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJhY2tncm91bmQtY29sb3I6ICNlOTEyMjQ7XG4gIGJvcmRlci1jb2xvcjogI2U5MTIyNDtcbn1cbmJvZHkgLmRhbmdlci1jb2w6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyOmVuYWJsZWQ6aG92ZXIsXG5ib2R5XG4gIC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlclxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2MwMTEyMDtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogI2MwMTEyMDtcbn1cbmJvZHkgLmRhbmdlci1jb2w6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXI6ZW5hYmxlZDpmb2N1cyxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6Zm9jdXMge1xuICAtd2Via2l0LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7XG4gIC1tb3otYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2Y5YjRiYTtcbiAgYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2Y5YjRiYTtcbn1cbmJvZHkgLmRhbmdlci1jb2w6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlcjplbmFibGVkOmFjdGl2ZSxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyXG4gID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6YWN0aXZlIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2E5MDAwMDtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogI2E5MDAwMDtcbn1cblxuLy8gRGFuZ2VyIG91dGxpbmVcbmJvZHkgLmRhbmdlci1jb2wtb3V0bGluZSxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZSxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmUgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogI2U5MTIyNDtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgYm9yZGVyLWNvbG9yOiAjZmZmO1xufVxuXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmUsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0IHtcbiAgYm9yZGVyLWNvbG9yOiAjZTkxMjI0O1xufVxuXG5ib2R5IC5kYW5nZXItY29sLW91dGxpbmU6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmU6ZW5hYmxlZDpob3ZlcixcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmVcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGNvbG9yOiAjYzAxMTIwO1xuICBib3JkZXItY29sb3I6ICNmZmY7XG59XG5cbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZTplbmFibGVkOmhvdmVyLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZVxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYm9yZGVyLWNvbG9yOiAjYzAxMTIwO1xufVxuXG5ib2R5IC5kYW5nZXItY29sLW91dGxpbmU6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZTplbmFibGVkOmZvY3VzLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZVxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZjliNGJhO1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7XG59XG5ib2R5IC5kYW5nZXItY29sLW91dGxpbmU6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lOmVuYWJsZWQ6YWN0aXZlLFxuYm9keVxuICAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZVxuICA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmFjdGl2ZSB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGNvbG9yOiAjYTkwMDAwO1xuICBib3JkZXItY29sb3I6ICNmZmY7XG59XG5cbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZTplbmFibGVkOmFjdGl2ZSxcbmJvZHlcbiAgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmVcbiAgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBib3JkZXItY29sb3I6ICNhOTAwMDA7XG59XG5cbi8vIE92ZXJyaWRpbmcgb3RoZXIgUHJpbWVORyBzdHlsZXNcblxuLy8gTW92aW5nIG1hcmdpbiB0byBsZWZ0IHNpZGUgLSBmcm9tIHJpZ2h0IGZvciBidXR0b25zIGluIGRpYWxvZy9jYXJkIGZvb3RlcnNcbmJvZHkgLnVpLWRpYWxvZyAudWktZGlhbG9nLWZvb3RlciBidXR0b24sXG5ib2R5IC51aS1jYXJkIC51aS1jYXJkLWZvb3RlciBidXR0b24ge1xuICBtYXJnaW46IDAgMCAwIDAuNWVtICFpbXBvcnRhbnQ7XG59XG5cbmJvZHkgLnVpLWRpYWxvZyB7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDJweCByZ2JhKDAsIDAsIDAsIDAuMSkgIWltcG9ydGFudDtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXIge1xuICBib3JkZXItcmFkaXVzOiA0cHggNHB4IDAgMDtcbn1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctZm9vdGVyIHtcbiAgYm9yZGVyLXJhZGl1czogMCAwIDRweCA0cHg7XG59XG5cbi8vIE1ha2UgdWkgZXJyb3IgbWVzc2FnZXMgbW9yZSBhdHRyYWN0aXZlXG5ib2R5IC51aS1tZXNzYWdlcy1lcnJvciB7XG4gIGJvcmRlcjogbm9uZTtcbiAgZm9udC13ZWlnaHQ6IDgwMDtcbiAgcGFkZGluZzogMDtcbiAgZGlzcGxheTogYmxvY2s7XG4gIHdpZHRoOiAxMDAlO1xuXG4gIHRleHQtYWxpZ246IHJpZ2h0O1xuXG4gIC8vIEZyb20gLnVpLWlucHV0dGV4dC5uZy1kaXJ0eS5uZy1pbnZhbGlkXG4gIGNvbG9yOiAjYTgwMDAwO1xufVxuXG4vLyBSZW1vdmUgbGVmdCBwYWRkaW5nIGZyb20gZXJyb3IgbWVzc2FnZXMgVUxcbmJvZHkgLm5nLWRpcnR5Lm5nLWludmFsaWQgKyB1bCB7XG4gIHBhZGRpbmctaW5saW5lLXN0YXJ0OiAwO1xufVxuXG4vLyBNYWtlIGludmFsaWQgaW5wdXQgYm9yZGVyIHJlZCAtIGV2ZW4gd2hlbiBmb2N1c3NlZFxuYm9keSAudWktaW5wdXR0ZXh0Lm5nLWludmFsaWQ6ZW5hYmxlZDpmb2N1cyxcbi51aS1pbnB1dHRleHQge1xuICBib3JkZXItY29sb3I6ICNhODAwMDA7XG59XG5cbi8vIEFkZCBsaWdodCByZWQgb3V0bGluZSB0byBpbnZhbGlkIHRleHQgaW5wdXRzXG5ib2R5IC51aS1pbnB1dHRleHQsXG5ib2R5IC51aS1pbnB1dGdyb3VwIC51aS1pbnB1dHRleHQubmctZGlydHkubmctaW52YWxpZCArIC51aS1pbnB1dGdyb3VwLWFkZG9uIHtcbiAgdHJhbnNpdGlvbjogYm94LXNoYWRvdyAwLjJzO1xufVxuXG5ib2R5IC51aS1pbnB1dHRleHQubmctZGlydHkubmctaW52YWxpZCxcbmJvZHkgcC1kcm9wZG93bi5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLWRyb3Bkb3duLFxuYm9keSBwLWF1dG9jb21wbGV0ZS5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLWF1dG9jb21wbGV0ZSA+IC51aS1pbnB1dHRleHQsXG5ib2R5IHAtY2FsZW5kYXIubmctZGlydHkubmctaW52YWxpZCA+IC51aS1jYWxlbmRhciA+IC51aS1pbnB1dHRleHQsXG5ib2R5IHAtY2hpcHMubmctZGlydHkubmctaW52YWxpZCA+IC51aS1pbnB1dHRleHQsXG5ib2R5IHAtaW5wdXRtYXNrLm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktaW5wdXR0ZXh0LFxuYm9keSBwLWNoZWNrYm94Lm5nLWRpcnR5Lm5nLWludmFsaWQgLnVpLWNoa2JveC1ib3gsXG5ib2R5IHAtcmFkaW9idXR0b24ubmctZGlydHkubmctaW52YWxpZCAudWktcmFkaW9idXR0b24tYm94LFxuYm9keSBwLWlucHV0c3dpdGNoLm5nLWRpcnR5Lm5nLWludmFsaWQgLnVpLWlucHV0c3dpdGNoLFxuYm9keSBwLWxpc3Rib3gubmctZGlydHkubmctaW52YWxpZCAudWktaW5wdXR0ZXh0LFxuYm9keSBwLW11bHRpc2VsZWN0Lm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktbXVsdGlzZWxlY3QsXG5ib2R5IHAtc3Bpbm5lci5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLWlucHV0dGV4dCxcbmJvZHkgcC1zZWxlY3RidXR0b24ubmctZGlydHkubmctaW52YWxpZCAudWktYnV0dG9uLFxuYm9keSBwLXRvZ2dsZWJ1dHRvbi5uZy1kaXJ0eS5uZy1pbnZhbGlkIC51aS1idXR0b24ge1xuICBib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZjliNGJhO1xufVxuXG4vLyBFeHRlbmQgdGV4dC1maWVsZCByZWQgb3V0bGluZSB0byBhZGphY2VudCBsYWJlbHMgYW5kIGJ1dHRvbnNcbmJvZHkgLnVpLWlucHV0Z3JvdXAgLnVpLWlucHV0dGV4dC5uZy1kaXJ0eS5uZy1pbnZhbGlkICsgLnVpLWlucHV0Z3JvdXAtYWRkb24ge1xuICBib3gtc2hhZG93OiAycHggLTIuOHB4IDAgI2Y5YjRiYSwgMnB4IDIuOHB4IDAgI2Y5YjRiYTtcbn1cblxuYm9keSBwLWNhbGVuZGFyLm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktY2FsZW5kYXIudWktY2FsZW5kYXItdy1idG4ge1xuICBib3gtc2hhZG93OiAwIDAgMCAzcHggI2Y5YjRiYTtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xufVxuXG5ib2R5XG4gIC51aS1pbnB1dGdyb3VwXG4gIC51aS1pbnB1dHRleHQ6ZW5hYmxlZDpmb2N1czpub3QoLnVpLXN0YXRlLWVycm9yKVxuICArIC51aS1pbnB1dGdyb3VwLWFkZG9uLFxuYm9keVxuICBwLWNhbGVuZGFyLm5nLWRpcnR5Lm5nLWludmFsaWRcbiAgPiAudWktY2FsZW5kYXJcbiAgPiAudWktaW5wdXR0ZXh0OmVuYWJsZWQ6Zm9jdXM6bm90KC51aS1zdGF0ZS1lcnJvciksXG5ib2R5XG4gIHAtY2FsZW5kYXIubmctZGlydHkubmctaW52YWxpZFxuICA+IC51aS1jYWxlbmRhclxuICA+IC51aS1pbnB1dHRleHQ6ZW5hYmxlZDpmb2N1czpub3QoLnVpLXN0YXRlLWVycm9yKVxuICArIC51aS1jYWxlbmRhci1idXR0b24ge1xuICBib3gtc2hhZG93OiBub25lO1xufVxuXG4vLyBGb3JjZSAxMDAlIHdpZHRoIG9uIHVpLXRleHQtaW5wdXRzXG4qOm5vdCgudWktY2FsZW5kYXIpIC51aS1pbnB1dHRleHQge1xuICB3aWR0aDogMTAwJTtcbn1cblxuYm9keSAudWktc3RhdGUtZGlzYWJsZWQsXG5ib2R5IC51aS13aWRnZXQ6ZGlzYWJsZWQge1xuICBjdXJzb3I6IG5vdC1hbGxvd2VkO1xufVxuXG4vLyBTdHlsZXMgZm9yIEZvcm1zXG5cbi5mb3JtIGR5bmFtaWMtcHJpbWVuZy1mb3JtLWNvbnRyb2wgPiBkaXYge1xuICBtYXJnaW4tYm90dG9tOiAxMHB4O1xufVxuXG4uZm9ybSAudWktY2FsZW5kYXIsXG4uZm9ybSAudWktc3Bpbm5lciB7XG4gIHdpZHRoOiAxMDAlO1xufVxuXG4vLyBNYWtlIHByaW1lbmcgY2FsZW5kYXIgaW5wdXQgdGV4dGJveGVzIHRoZSBmdWxsIHdpZHRoIG9mIHRoZSBwb3B1cFxuLmZvcm0gLnVpLWNhbGVuZGFyLXctYnRuIGlucHV0LnVpLWlucHV0dGV4dCB7XG4gIHdpZHRoOiBjYWxjKDEwMCUgLSAzM3B4KTtcbn1cblxuLy8gTWFrZSBEYXRlcGlja2VyIGluIHBvcHVwcyBhIGJpdCBzbWFsbGVyXG4uZm9ybSAudWktZGF0ZXBpY2tlciB7XG4gIHBhZGRpbmc6IDAuNWVtO1xufVxuXG4uZm9ybSAudWktZGF0ZXBpY2tlciB7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cblxuLmZvcm0gLnVpLWRhdGVwaWNrZXIgLnVpLXRpbWVwaWNrZXIge1xuICBwYWRkaW5nOiAxMHB4IDAgMCAwO1xuICBmb250LXNpemU6IDExcHg7XG59XG5cbi5mb3JtIC51aS1kYXRlcGlja2VyIHRhYmxlIHtcbiAgZm9udC1zaXplOiAxMXB4O1xufVxuXG4vLyBTY3JvbGxiYXIgc3R5bGVcblxuLy8gU2Nyb2xsYmFyIGFkYXB0ZWQgZnJvbSBodHRwczovL3d3dy53M3NjaG9vbHMuY29tL2hvd3RvL2hvd3RvX2Nzc19jdXN0b21fc2Nyb2xsYmFyLmFzcFxuLyogd2lkdGggKi9cbjo6LXdlYmtpdC1zY3JvbGxiYXIge1xuICB3aWR0aDogMTBweDtcbn1cblxuLyogVHJhY2sgKi9cbjo6LXdlYmtpdC1zY3JvbGxiYXItdHJhY2sge1xuICBiYWNrZ3JvdW5kOiBub25lO1xufVxuXG4vKiBIYW5kbGUgKi9cbjo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWIge1xuICBiYWNrZ3JvdW5kOiAjMDAwMDAwMzM7XG4gIGJvcmRlcjogMnB4IHNvbGlkIHJnYmEoMCwgMCwgMCwgMCk7XG4gIGJhY2tncm91bmQtY2xpcDogcGFkZGluZy1ib3g7XG4gIGJvcmRlci1yYWRpdXM6IDVweDtcbn1cblxuLyogSGFuZGxlIG9uIGhvdmVyICovXG46Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1iOmhvdmVyIHtcbiAgYmFja2dyb3VuZDogIzAwMDAwMDU1O1xuICBiYWNrZ3JvdW5kLWNsaXA6IHBhZGRpbmctYm94O1xufVxuIiwiQGltcG9ydCBcIi4uLy4uLy4uL3N0eWxlcy5zY3NzXCI7XG5AaW1wb3J0IFwiLi4vc3R5bGVzL2Zha2UtbGVhZmxldC1jb250cm9sLnNjc3NcIjtcblxuYm9keSAudWktc2lkZWJhciB7XG4gIEBleHRlbmQgLmZha2UtbGVhZmxldC1jb250cm9sLWNvbG91cnM7XG4gIHotaW5kZXg6IDE0MDAgIWltcG9ydGFudDtcbiAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDAuM3MgY3ViaWMtYmV6aWVyKDAuNDU1LCAwLjAzLCAwLjUxNSwgMC45NTUpO1xuICBwYWRkaW5nOiAwO1xuICBib3JkZXItcmFkaXVzOiAwO1xufVxuXG5ib2R5IC51aS1zaWRlYmFyLWJvdHRvbSB7XG4gIGJveC1zaGFkb3c6IDAgLThweCAwcHggMnB4IHJnYmEoMCwgMCwgMCwgMC4yKTtcbn1cblxuYm9keSAudWktc2lkZWJhci1ib3R0b20sXG5ib2R5IC51aS1zaWRlYmFyLXRvcCB7XG4gIGhlaWdodDogMzIwcHg7XG59XG5cbmJvZHkgLnVpLXNpZGViYXItbGVmdCxcbmJvZHkgLnVpLXNpZGViYXItcmlnaHQge1xuICB3aWR0aDogMzEzcHg7XG59XG5cbi51aS1zaWRlYmFyLndpZHRoLWZpdC1jb250ZW50IHtcbiAgd2lkdGg6IGZpdC1jb250ZW50O1xufVxuXG4udWktc2lkZWJhci5oZWlnaHQtZml0LWNvbnRlbnQge1xuICBoZWlnaHQ6IGZpdC1jb250ZW50O1xufVxuXG4udWktc2lkZWJhci53aWR0aC1maXQtY29udGVudCAuc2lkZWJhci1jb250YWluZXIge1xuICBtaW4td2lkdGg6IDMxM3B4O1xuICBtYXgtd2lkdGg6IDEwMHZ3O1xufVxuXG4vLyBUaGlzIHJlc2V0cyBwYWRkaW5nIChvdmVycmlkZGVuIGJ5IHByZXZpb3VzIHJ1bGUpIC0gYW5kIHNldHMgc2Nyb2xsIGJveCB0byBzdGFydCBqdXN0IGJlbG93IGgxXG4uc2lkZWJhci1jb250YWluZXIge1xuICBoZWlnaHQ6IGNhbGMoMTAwJSAtIDUzcHgpO1xuICBvdmVyZmxvdy15OiBhdXRvO1xuICBvdmVyZmxvdy15OiBvdmVybGF5O1xuICAtbXMtb3ZlcmZsb3ctc3R5bGU6IC1tcy1hdXRvaGlkaW5nLXNjcm9sbGJhcjtcbiAgb3ZlcmZsb3cteDogaGlkZGVuO1xufVxuXG4uc2lkZWJhci1wYWRkaW5nIHtcbiAgcGFkZGluZy10b3A6IDAuNTcxZW07XG4gIHBhZGRpbmctcmlnaHQ6IDFlbTtcbiAgcGFkZGluZy1ib3R0b206IDAuNTcxZW07XG4gIHBhZGRpbmctbGVmdDogMWVtO1xufVxuXG4uc2lkZWJhci1mb290ZXIge1xuICBib3JkZXItdG9wOiAxcHggc29saWQgI2M4YzhjODtcbiAgYmFja2dyb3VuZDogI2Y0ZjRmNDtcbn1cblxuYm9keSAudWktc2lkZWJhciAudWktc2lkZWJhci1jbG9zZSB7XG4gIHBhZGRpbmctdG9wOiAwLjU3MWVtO1xuICBwYWRkaW5nLXJpZ2h0OiAxZW07XG4gIHBhZGRpbmctYm90dG9tOiAwLjU3MWVtO1xuICBwYWRkaW5nLWxlZnQ6IDFlbTtcbiAgZmxvYXQ6IG5vbmU7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgcmlnaHQ6IDA7XG4gIHRvcDogMDtcbn1cblxuYm9keSAudWktc2lkZWJhciBoMSB7XG4gIG1hcmdpbi1ib3R0b206IDA7XG4gIG1hcmdpbi10b3A6IC04cHg7XG4gIHBhZGRpbmctdG9wOiAyM3B4O1xuICBwYWRkaW5nLWxlZnQ6IDE1cHg7XG4gIHBhZGRpbmctYm90dG9tOiAwLjY3ZW07XG4gIHBhZGRpbmctcmlnaHQ6IDEwMHB4O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjRmNGY0O1xuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2M4YzhjODtcbn1cblxuQG1lZGlhIChtaW4td2lkdGg6IDc2OHB4KSB7XG4gIGJvZHkgLnNpZGViYXItY29udGFpbmVyIC51aS1vcmRlcmxpc3QtY29udHJvbHMtcmlnaHQge1xuICAgIG1hcmdpbi1yaWdodDogLTE1cHg7XG4gIH1cbn1cblxuLy8gQ2hhbmdlIG9yZGVybGlzdCBjb250cm9sIGJ1dHRvbnNcbmJvZHkgLnVpLW9yZGVybGlzdCAudWktb3JkZXJsaXN0LWNvbnRyb2xzIGJ1dHRvbiB7XG4gIEBleHRlbmQgLnNlY29uZGFyeS1jb2w7XG59XG5cbmJvZHkgLnVpLW9yZGVybGlzdCAudWktb3JkZXJsaXN0LWNvbnRyb2xzIGJ1dHRvbjpob3ZlciB7XG4gIEBleHRlbmQgLnNlY29uZGFyeS1jb2w6aG92ZXI7XG59XG5cbmJvZHkgLnVpLW9yZGVybGlzdCAudWktb3JkZXJsaXN0LWNvbnRyb2xzIGJ1dHRvbjpmb2N1cyB7XG4gIEBleHRlbmQgLnNlY29uZGFyeS1jb2w6Zm9jdXM7XG59XG5cbmJvZHkgLnVpLW9yZGVybGlzdCAudWktb3JkZXJsaXN0LWNvbnRyb2xzIGJ1dHRvbjphY3RpdmUge1xuICBAZXh0ZW5kIC5zZWNvbmRhcnktY29sOmFjdGl2ZTtcbn1cblxuLy8gU2xpZ2h0bHkgZGFya2VucyB0aGUgJ2RlZmF1bHQnIGNvbG9yIC0gd2hlbiBpdCBpcyBjb250YWluZWQgd2l0aGluIGEgaGlnaGxpZ2h0ZWQgZWxlbWVudCAoaS5lLiBhIHNlbGVjdGVkIGxpc3QgaXRlbSBpbiB0aGUgbGF5ZXIgb3JkZXIgbGlzdClcbi51aS1zdGF0ZS1oaWdobGlnaHQgYS5pY29uLXRvZ2dsZS5kZWZhdWx0LWNvbCB7XG4gIGJhY2tncm91bmQtY29sb3I6ICMwMDY1YjM7XG59XG4iLCJAaW1wb3J0IFwiLi4vc3R5bGVzL2Zha2UtbGVhZmxldC1jb250cm9sLnNjc3NcIjtcbkBpbXBvcnQgXCIuLi9zdHlsZXMvc2lkZWJhci5zY3NzXCI7XG5cbi8qIE5vdGVzIG9uIHotaW5kZXggKGluIHRoaXMgb3JkZXIpXG4xID0gTGVhZmxldFxuXG5HZW93ZWJNYXAgTGF5ZXJzIChDYW52YXMsIFNWRy4uLilcblxuNTAwID0gR2Vvd2ViL0NTSVJPIExvZ29cblxuNjAwID0gTGVhZmxldCBMYXllcnMgKGVkaXRhYmxlIGZlYXR1cmVzIC0gcG9seWdvbnMuLi4pXG5cbjY1MCA9IExlYWZsZXQgdG9vbHRpcCAoc2hvd3MgbGF5ZXIgdmFsdWVzIG9uIGNsaWNrKVxuXG43MDAgPSBMZWFmbGV0IGRyYXcgZ3VpZGVzIChncmFwaGljYWwgZWxlbWVudHMgc2hvd24gd2hpbGUgZHJhd2luZyBzaGFwZXMpXG5cbjkwMCA9IExlYWZsZXQgY29udHJvbHMgKGJ1dHRvbnMpICsgem9vbSBjb250cm9sbGVyXG5cbjEwMDAgPSBUaW1lIHNsaWRlclxuXG5cbjExMDAgPSBGaWxlIGJyb3dzZXIgRGlhbG9nIChzbyBpdCBpcyBiZWxvdyBkcm9wIHVwbG9hZC4uLilcblxuMTIwMCA9IFNwaW5uZXJcblxuMTI1MCA9IEZpbGUgRHJvcCBVcGxvYWQgQ29tcG9uZW50XG5cbjEzMDAgPSBHZW93ZWJNYXAgY29udHJvbHMgKGNvbmZpZywgc3RhcnQsIGxvZywgY29ubmVjdGVkIHN0YXR1cy4uLilcblxuMTM1MCA9IENoYXJ0IHNpZGViYXJcblxuMTQwMCA9IExvZyBTaWRlYmFyLCBMYXllciBTaWRlYmFyLCBDb25maWcgU2lkZWJhclxuXG4xNTAwID0gRGlhbG9nc1xuXG4xOTAwID0gZmlsZSB1cGxvYWQgc3Bpbm5lclxuXG4yMDAwID0gdG9hc3QgKG1lc3NhZ2UgcG9wdXBzIGluIHRvcCByaWdodCBjb3JuZXIpIFxuXG5cbiovXG5cbmE6aG92ZXIge1xuICBjb2xvcjogIzExNmZiZjtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuXG4jbWFwLWNvbnRhaW5lciB7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuI21hcCxcbiNtYXAtb3ZlcmxheSxcbi5zdmctb3ZlcmxheSB7XG4gIGhlaWdodDogY2FsYygxMDB2aCk7XG4gIHdpZHRoOiAxMDB2dztcbn1cblxuLnN2Zy1vdmVybGF5IHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgei1pbmRleDogNTAwO1xuICB0b3A6IDA7XG4gIHRyYW5zZm9ybS1vcmlnaW46IHRvcCBsZWZ0O1xufVxuXG4jbGF5ZXItbGVnZW5kcyB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgcmlnaHQ6IC0ycHg7XG4gIG92ZXJmbG93LXk6IGF1dG87XG4gIG92ZXJmbG93LXk6IG92ZXJsYXk7XG4gIC1tcy1vdmVyZmxvdy1zdHlsZTogLW1zLWF1dG9oaWRpbmctc2Nyb2xsYmFyO1xuICB0b3VjaC1hY3Rpb246IG5vbmU7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICBwYWRkaW5nOiAycHg7XG59XG5cbiNsYXllci1sZWdlbmRzIC5sZWdlbmQge1xuICBAZXh0ZW5kIC5mYWtlLWxlYWZsZXQtY29udHJvbC1jb2xvdXJzO1xuICBib3gtc2l6aW5nOiBjb250ZW50LWJveDtcblxuICBkaXNwbGF5OiBibG9jaztcbiAgZmxvYXQ6IHJpZ2h0O1xuICBjbGVhcjogYm90aDtcblxuICBwYWRkaW5nOiA4cHg7XG4gIG1hcmdpbi1ib3R0b206IDEwcHg7XG5cbiAgZm9udC1zaXplOiAxNHB4O1xuXG4gID4gZyB7XG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgMTRweCk7XG4gIH1cblxuICB0ZXh0IHtcbiAgICBmaWxsOiAjMzMzO1xuICB9XG5cbiAgLmxlZ2VuZFRpdGxlIHtcbiAgICBmb250LXdlaWdodDogYm9sZDtcbiAgfVxufVxuXG4uZGlzYWJsZS1wb2ludGVyIHtcbiAgcG9pbnRlci1ldmVudHM6IG5vbmUgIWltcG9ydGFudDtcbiAgdG91Y2gtYWN0aW9uOiBub25lICFpbXBvcnRhbnQ7XG59XG5cbi5sZWFmbGV0LWNhbnZhcy1vdmVybGF5LFxuLmxlYWZsZXQtc3ZnLW92ZXJsYXkge1xuICBvdmVyZmxvdzogdmlzaWJsZTtcbiAgdHJhbnNmb3JtLW9yaWdpbjogdG9wIGxlZnQ7XG59XG5cbi8vIFRoaXMgaXMgcmVxdWlyZWQgdG8gbWl4LWJsZW5kIHN2Zy9jYW52YXMgbGF5ZXJzIHdpdGggdGhlIGJhc2VtYXAgbGF5ZXJzXG4ubGVhZmxldC10aWxlLXBhbmUsXG4ubGVhZmxldC1vdmVybGF5LXBhbmUge1xuICB6LWluZGV4OiBhdXRvO1xufVxuXG4vLyBBbmQgdGhpcyBpcyByZXF1aXJlZCBzbyB0aGUgbGVhZmxldC1kcmF3IGd1aWRlcyAod2hpY2ggYXJlIGluIGxlYWZsZXQtb3ZlcmxheS1wYW5lKSBhcmUgbm90IGhpZGRlbiBieSB0aGUgcHJldmlvdXMgc3R5bGVcbi5sZWFmbGV0LWRyYXctZ3VpZGVzIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB6LWluZGV4OiA3MDA7XG59XG5cbi8qIE9WRVJSSURFIExFQUZMRVQgem9vbSBhbmQgZmFkZSBhbmltYXRpb25zICovXG5cbi5sZWFmbGV0LWZhZGUtYW5pbSAubGVhZmxldC10aWxlIHtcbiAgd2lsbC1jaGFuZ2U6IG9wYWNpdHk7XG59XG5cbi5sZWFmbGV0LWZhZGUtYW5pbSAubGVhZmxldC1wb3B1cCB7XG4gIG9wYWNpdHk6IDA7XG4gIHRyYW5zaXRpb246IG9wYWNpdHkgMC4xNXMgbGluZWFyO1xufVxuXG4ubGVhZmxldC16b29tLWFuaW0gLmxlYWZsZXQtem9vbS1hbmltYXRlZCxcbi5sZWFmbGV0IHtcbiAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDAuMTVzIGN1YmljLWJlemllcigwLCAwLCAwLjI1LCAxKSAhaW1wb3J0YW50O1xufVxuXG4ubGVhZmxldC16b29tLWFuaW0gLmxlYWZsZXQtY2FudmFzLW92ZXJsYXksXG4ubGVhZmxldC16b29tLWFuaW0gLmxlYWZsZXQtc3ZnLW92ZXJsYXkge1xuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMC4xNXMgY3ViaWMtYmV6aWVyKDAsIDAsIDAuMjUsIDEpO1xufVxuXG4ubGVhZmxldC1mYWRlLWFuaW0gLmxlYWZsZXQtbWFwLXBhbmUgLmxlYWZsZXQtcG9wdXAge1xuICBvcGFjaXR5OiAxO1xufVxuXG4ubGVhZmxldC16b29tLWFuaW1hdGVkIHtcbiAgLXdlYmtpdC10cmFuc2Zvcm0tb3JpZ2luOiAwIDA7XG4gIHRyYW5zZm9ybS1vcmlnaW46IDAgMDtcbn1cblxuLmxlYWZsZXQtem9vbS1hbmltIC5sZWFmbGV0LXpvb20tYW5pbWF0ZWQsXG4ubGVhZmxldC1jYW52YXMtb3ZlcmxheSxcbi5sZWFmbGV0LXN2Zy1vdmVybGF5IHtcbiAgd2lsbC1jaGFuZ2U6IHRyYW5zZm9ybTtcbn1cblxuLmxlYWZsZXQtem9vbS1hbmltIC5sZWFmbGV0LXRpbGUsXG4ubGVhZmxldC1wYW4tYW5pbSAubGVhZmxldC10aWxlIHtcbiAgdHJhbnNpdGlvbjogbm9uZTtcbn1cblxuLmxlYWZsZXQtem9vbS1hbmltIC5sZWFmbGV0LXpvb20taGlkZSB7XG4gIHZpc2liaWxpdHk6IGhpZGRlbjtcbn1cblxuLy8gU3R5bGVzIGZvciBEMyBjcmVhdGVkIGVsZW1lbnRzIChtdXN0IGhhdmUgcHJlZml4KVxuI3N2Zy1vdmVybGF5LmNvbnRyb2wsXG4uY29udHJvbCB7XG4gIHBvaW50ZXItZXZlbnRzOiBhbGw7XG59XG5cbi8vIE1ha2Ugd2F5IGZvciB0aGUgY29uZmlnIGFuZCBsYXllciB0b2dnbGVzIC0+IG1vdmVzIGxlYWZsZXQgY29udHJvbHMgdG8gdmVydGljYWwgbWlkZGxlXG4ubGVhZmxldC10b3Age1xuICB0b3A6IDUwJSAhaW1wb3J0YW50O1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSk7XG59XG5cbiN0b3AtcmlnaHQtY29udHJvbHMge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHJpZ2h0OiAxMHB4O1xuICB0b3A6IDEwcHg7XG4gIHotaW5kZXg6IDkwMDtcbiAgdHJhbnNpdGlvbjogcmlnaHQgMC4zcyBjdWJpYy1iZXppZXIoMC40NTUsIDAuMDMsIDAuNTE1LCAwLjk1NSk7XG4gIC8vIFRoaXMgbWltaWNzIFByaW1lTkcgU2lkZWJhciBhbmltYXRpb25cbiAgLy8gdHJhbnNpdGlvbjogcmlnaHQgMC4zcztcbn1cbiNib3R0b20tcmlnaHQtY29udHJvbHMge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHJpZ2h0OiAxMHB4O1xuICBib3R0b206IDEwcHg7XG4gIHotaW5kZXg6IDkwMDtcbiAgLy8gVGhpcyBtaW1pY3MgUHJpbWVORyBTaWRlYmFyIGFuaW1hdGlvblxuICAvLyB0cmFuc2l0aW9uOiByaWdodCAwLjNzO1xufVxuI3RvcC1yaWdodC1jb250cm9scy5sYXllci1zaWRlYmFyLXZpc2JsZSwgI2JvdHRvbS1yaWdodC1jb250cm9scy5sYXllci1zaWRlYmFyLXZpc2JsZSwgLmxlZ2VuZC1vdmVybGF5LmxheWVyLXNpZGViYXItdmlzYmxle1xuICByaWdodDogMzI1cHg7XG59XG5cbi8vIEFsaWduIHNtYWxsZXIgZmFrZS1sZWFmbGV0LWNvbnRyb2xzIHRvIHJpZ2h0IGVkZ2Ugb2YgbGFyZ2UgZmFrZS1sZWFmbGV0LWNvbnRyb2xcbiN0b3AtcmlnaHQtY29udHJvbHMgLmZha2UtbGVhZmxldC1jb250cm9sIHtcbiAgcmlnaHQ6IC0xNHB4O1xufVxuXG4jdG9wLXJpZ2h0LWNvbnRyb2xzLmhpZGRlbiB7XG4gIHJpZ2h0OiAtNjBweDtcbn1cblxuI3RvcC1sZWZ0LWNvbnRyb2xzLFxuI2VkaXQtZmVhdHVyZS1jb250cm9sbGVyLFxuI3pvb20tY29udHJvbGxlciB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbGVmdDogMTBweDtcbiAgdHJhbnNpdGlvbjogbGVmdCAwLjVzIGN1YmljLWJlemllcigwLjQ1NSwgMC4wMywgMC41MTUsIDAuOTU1KTtcbn1cblxuI3RvcC1sZWZ0LWNvbnRyb2xzLmhpZGRlbixcbiNlZGl0LWZlYXR1cmUtY29udHJvbGxlci5oaWRkZW4sXG4jem9vbS1jb250cm9sbGVyLmhpZGRlbiB7XG4gIGxlZnQ6IC02MHB4O1xufVxuXG4jZWRpdC1mZWF0dXJlLWNvbnRyb2xsZXIge1xuICB6LWluZGV4OiA5OTk7XG4gIGJvdHRvbTogMDtcbn1cblxuI2VkaXQtZmVhdHVyZS1jb250cm9sbGVyIC5tYXBib3hnbC1jdHJsLm1hcGJveGdsLWN0cmwtZ3JvdXAge1xuICBtYXJnaW46IDAgMCAxMHB4IDA7XG4gIGZsb2F0OiBsZWZ0O1xufVxuXG4jdG9wLWxlZnQtY29udHJvbHMge1xuICB6LWluZGV4OiAxMzAwO1xuICB0b3A6IDEwcHg7XG59XG5cbiNlZGl0LWZlYXR1cmUtY29udHJvbGxlciBhOmhvdmVyLFxuI3pvb20tY29udHJvbGxlciBhOmhvdmVyLFxuLmxlYWZsZXQtY29udHJvbC1sYXllcnMtdG9nZ2xlIHtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuXG4ubWFwYm94Z2wtY3RybC1ncm91cCA+IGJ1dHRvbiB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuLm1hcC1sb2dvIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDZweDtcbiAgbGVmdDogNjFweDtcbiAgei1pbmRleDogNTAwO1xuICBvcGFjaXR5OiAwLjU7XG4gIHRyYW5zaXRpb246IG9wYWNpdHkgY3ViaWMtYmV6aWVyKDAuNDU1LCAwLjAzLCAwLjUxNSwgMC45NTUpIDAuMnM7XG4gIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xuICB0ZXh0LXNoYWRvdzogMCAwIDNweCB3aGl0ZSwgMCAwIDNweCB3aGl0ZSwgMCAwIDNweCB3aGl0ZSwgMCAwIDNweCB3aGl0ZTtcbiAgZm9udC1zaXplOiAyNXB4O1xuICBmb250LXdlaWdodDogNjAwO1xufVxuXG4ubWFwLWxvZ28gLmxvZ28tdGV4dCB7XG59XG5cbi5tYXAtbG9nbyAubWFwLWxvZ28taW1nIHtcbiAgaGVpZ2h0OiA3N3B4O1xuICBtYXJnaW46IGF1dG87XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBmb250LWZhbWlseTogUm9ib3RvLCBcIkhlbHZldGljYSBOZXVlXCIsIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWYgIWltcG9ydGFudDtcbiAgLy8gZmlsdGVyOiBkcm9wLXNoYWRvdygwIDAgMnB4IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC41KSlcbiAgLy8gICBkcm9wLXNoYWRvdygwIDAgMnB4IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC41KSlcbiAgLy8gICBkcm9wLXNoYWRvdygwIDAgMnB4IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC41KSlcbiAgLy8gICBkcm9wLXNoYWRvdygwIDAgMnB4IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC41KSk7XG59XG5cbi5tYXAtbG9nbzpob3ZlciB7XG4gIG9wYWNpdHk6IDAuNztcbn1cblxuI3RpbWVsaW5lLWNvbnRyb2xsZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGJvdHRvbTogMTBweDtcbiAgbGVmdDogNTAlO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XG4gIHdpZHRoOiBjYWxjKDEwMHZ3IC0gNjUwcHgpO1xuICBtaW4td2lkdGg6IDUwMHB4O1xuICBtYXgtd2lkdGg6IDEwMDBweDtcbiAgaGVpZ2h0OiBhdXRvO1xuXG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgei1pbmRleDogMTAwMDtcblxuICB0cmFuc2l0aW9uOiBib3R0b20gMC4zcyBjdWJpYy1iZXppZXIoMC40NTUsIDAuMDMsIDAuNTE1LCAwLjk1NSk7XG59XG5cbi50aW1lbGluZSB7XG4gIGdyaWQtdGVtcGxhdGUtY29sdW1uczogbWluLWNvbnRlbnQgYXV0byAxNjRweDtcbiAgZGlzcGxheTogZ3JpZDtcbiAgcGFkZGluZzogNXB4O1xufVxuXG4udGltZWxpbmUuaGlkZGVuIHtcbiAgYm90dG9tOiAtMTAwcHg7XG59XG5cbi50aW1lbGluZSAudWktY2FsZW5kYXItdy1idG4gaW5wdXQudWktaW5wdXR0ZXh0IHtcbiAgd2lkdGg6IGNhbGMoMTAwJSAtIDMzcHgpO1xufVxuXG4udGltZS1zbGlkZXItbGFiZWwge1xuICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBtYXJnaW46IDAgNXB4O1xufVxuXG4udGltZS1zbGlkZXIge1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCA1MCUpO1xuICBwYWRkaW5nOiAwIDE0cHg7XG4gIHRvcDogLTFweDtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuXG4udGltZS1pbnB1dCB7XG4gIHdpZHRoOiAxMzBweDtcbn1cblxuLmxlYWZsZXQtdG9vbGJhci0wIHtcbiAgd2lkdGg6IDM0cHg7XG4gIG1hcmdpbi1ib3R0b206IDEwcHg7XG59XG5cbi5sZWFmbGV0LWNvbnRyb2wtdG9vbGJhciA+IGxpOmZpcnN0LWNoaWxkID4gLmxlYWZsZXQtdG9vbGJhci1pY29uIHtcbiAgYm9yZGVyLXRvcC1sZWZ0LXJhZGl1czogMnB4O1xuICBib3JkZXItdG9wLXJpZ2h0LXJhZGl1czogMnB4O1xufVxuXG4ubGVhZmxldC1jb250cm9sLXRvb2xiYXIgPiBsaTpsYXN0LWNoaWxkID4gLmxlYWZsZXQtdG9vbGJhci1pY29uIHtcbiAgYm9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1czogMnB4O1xuICBib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1czogMnB4O1xufVxuXG4ubGVhZmxldC10b29sYmFyLWljb24tY3VzdG9tIHtcbiAgdGV4dC1kZWNvcmF0aW9uOiBub25lICFpbXBvcnRhbnQ7XG4gIGNvbG9yOiAjMzMzICFpbXBvcnRhbnQ7XG59XG5cbi5sZWFmbGV0LXRvb2xiYXItaWNvbi1jdXN0b206aG92ZXIge1xuICBjb2xvcjogIzIyMiAhaW1wb3J0YW50O1xuICBjdXJzb3I6IHBvaW50ZXI7XG59XG5cbi5pY29uLXRvZ2dsZSB7XG4gIGhlaWdodDogMTAwJTtcbiAgd2lkdGg6IDMwcHg7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBmbG9hdDogcmlnaHQ7XG4gIG1hcmdpbjogLTFweCAwO1xuICBmb250LXNpemU6IDE2cHg7XG4gIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgYm9yZGVyLXJhZGl1czogMTJweDtcbn1cblxuLmljb24tdG9nZ2xlOmhvdmVyIHtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuXG4vLyBGaXggaWNvbi10b2dnbGUgY29sb3VyIC0gYXMgaXQgY2xhc2hlcyB3aXRoIHRoZSBsaXN0IGl0ZW0gY29sb3Vyc1xuLnVpLXN0YXRlLWhpZ2hsaWdodCAuaWNvbi10b2dnbGUuZGVmYXVsdC1jb2wge1xuICBjb2xvcjogI2ZmZjtcbn1cblxuLnVpLXN0YXRlLWhpZ2hsaWdodCAuaWNvbi10b2dnbGUuZGVmYXVsdC1jb2w6aG92ZXIge1xuICBjb2xvcjogI2ZmZmZmZmNjO1xufVxuXG4udWktb3JkZXJsaXN0LWl0ZW06bm90KC51aS1zdGF0ZS1oaWdobGlnaHQpOmhvdmVyIGEuaWNvbi10b2dnbGUuc2Vjb25kYXJ5LWNvbCB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNkMmNmY2Y7XG59XG5cbi51aS1vcmRlcmxpc3QtaXRlbTpub3QoLnVpLXN0YXRlLWhpZ2hsaWdodCk6aG92ZXJcbiAgYS5pY29uLXRvZ2dsZS5zZWNvbmRhcnktY29sOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2MzYzNjMztcbn1cblxuLmRyYXctZmlyZS1pY29uIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDNweDtcbiAgbGVmdDogN3B4O1xufVxuXG4uc2Vjb25kYXJ5LWRyYXctZmlyZS1pY29uIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBjb2xvcjogI2FhYTtcbiAgdG9wOiA4cHg7XG4gIHJpZ2h0OiA2cHg7XG4gIGZvbnQtc2l6ZTogMTVweDtcbiAgZmlsdGVyOiBkcm9wLXNoYWRvdygtMXB4IC0xcHggMHB4ICNmZmYpO1xufVxuXG4ubGF5ZXItc2lkZWJhci1jb250YWluZXIgLnVpLXdpZGdldC1jb250ZW50LnVpLW9yZGVybGlzdC1saXN0IHtcbiAgbWluLWhlaWdodDogMjAwcHg7XG4gIGhlaWdodDogYXV0bztcbn1cblxuLmxheWVyLXZhbHVlcy1wb3B1cCAubWFwYm94Z2wtcG9wdXAtY29udGVudCB7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lO1xufVxuXG4vLyBMZWFmbGV0IHBvcHVwXG4ubGF5ZXItdmFsdWVzLXBvcHVwIC5sZWFmbGV0LXBvcHVwLWNvbnRlbnQtd3JhcHBlcixcbi5sYXllci12YWx1ZXMtcG9wdXAgLmxlYWZsZXQtcG9wdXAtdGlwIHtcbiAgQGV4dGVuZCAuZmFrZS1sZWFmbGV0LWNvbnRyb2wtY29sb3VycztcbiAgYm94LXNoYWRvdzogbm9uZTtcbn1cblxuLmxlYWZsZXQtcG9wdXAtdGlwIHtcbiAgYm90dG9tOiAtMThweDtcbiAgYm9yZGVyOiBub25lICFpbXBvcnRhbnQ7XG4gIGJvcmRlci1yYWRpdXM6IDA7XG4gIC13ZWJraXQtZmlsdGVyOiBkcm9wLXNoYWRvdygwcHggLTJweCAwcHggcmdiYSgwLCAwLCAwLCAwLjIpKTtcbiAgZmlsdGVyOiBkcm9wLXNoYWRvdygycHggMnB4IDBweCByZ2JhKDAsIDAsIDAsIDAuMikpO1xuICBwb2ludGVyLWV2ZW50czogbm9uZTtcbn1cblxuLmxlYWZsZXQtcG9wdXAtdGlwLWNvbnRhaW5lciB7XG4gIGJvdHRvbTogLTE4cHg7XG59XG5cbi5sYXllci12YWx1ZXMtcG9wdXAgLmxlYWZsZXQtcG9wdXAtY29udGVudC13cmFwcGVyIHtcbiAgYm9yZGVyLXJhZGl1czogM3B4O1xufVxuXG4ubGF5ZXItdmFsdWVzLXBvcHVwIC5sZWFmbGV0LXBvcHVwLWNvbnRlbnQge1xuICBtYXJnaW46IDA7XG4gIHBhZGRpbmc6IDEycHg7XG59XG5cbi5sYXllci12YWx1ZXMtcG9wdXAgcDpub3QoOmxhc3QtY2hpbGQpIHtcbiAgbWFyZ2luOiAwIDAgNHB4IDA7XG59XG5cbi5sYXllci12YWx1ZXMtcG9wdXAgcDpsYXN0LWNoaWxkIHtcbiAgbWFyZ2luOiAwO1xufVxuXG4jY2hhcnQtY29udGFpbmVyIHtcbiAgcGFkZGluZzogMCAxMHB4IDEwcHggMTBweDtcbn1cblxuI2NoYXJ0IHtcbiAgaGVpZ2h0OiAyNTBweDtcbn1cblxuYm9keSAudWktc2lkZWJhci5jaGFydC1zaWRlYmFyIHtcbiAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjkpO1xuICB6LWluZGV4OiAxMzUwICFpbXBvcnRhbnQ7XG4gIG1hcmdpbjogMDtcbiAgbWFyZ2luLWJvdHRvbTogLTRweDtcbiAgei1pbmRleDogMTAxMTtcbiAgd2lkdGg6IGNhbGMoMTAwdncgLSA2NTBweCk7XG4gIG1pbi13aWR0aDogNTAwcHg7XG4gIG1heC13aWR0aDogMTAwMHB4O1xuICBvcGFjaXR5OiAxO1xuICBsZWZ0OiA1MCU7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIDEwMCUpO1xuICBib3JkZXItcmFkaXVzOiA0cHg7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDJweCByZ2JhKDAsIDAsIDAsIDAuMSk7XG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjNzIGN1YmljLWJlemllcigwLjQ1NSwgMC4wMywgMC41MTUsIDAuOTU1KTtcbn1cblxuYm9keSAudWktc2lkZWJhci5jaGFydC1zaWRlYmFyLnVpLXNpZGViYXItYWN0aXZlIHtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgMCk7XG59XG5cbmJvZHkgLnVpLXNpZGViYXIuY2hhcnQtc2lkZWJhciBoMyB7XG4gIG1hcmdpbjogMDtcbiAgcGFkZGluZy10b3A6IDEwcHg7XG4gIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgYm9yZGVyLXRvcC1sZWZ0LXJhZGl1czogNHB4O1xuICBib3JkZXItdG9wLXJpZ2h0LXJhZGl1czogNHB4O1xufVxuXG4ubWFwYm94Z2wtY3RybC1ib3R0b20tbGVmdCB7XG4gIHRvcDogNTAlO1xuICBib3R0b206IHVuc2V0O1xuICBsZWZ0OiAwO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAtNTAlKTtcbn1cbiNzaW11bGF0aW9uLXBsYXkge1xuICBAZXh0ZW5kIC5mYWtlLWxlYWZsZXQtY29udHJvbC1jb2xvdXJzO1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGJvdHRvbTogMTBweDtcbiAgbGVmdDogNTAlICFpbXBvcnRhbnQ7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKTtcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xuICB6LWluZGV4OiAxMzAwO1xuICBwYWRkaW5nOiA1cHggMTBweDtcbiAgYmFja2dyb3VuZC1jbGlwOiBwYWRkaW5nLWJveDtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBvcGFjaXR5OiA3MCU7XG59XG4jc2ltdWxhdGlvbi1zcGVlZCB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgYm90dG9tOiA1cHg7XG4gIGxlZnQ6IDUwJSAhaW1wb3J0YW50O1xuICB6LWluZGV4OiAxNDAwO1xufVxuLmxlZ2VuZC1vdmVybGF5IHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB3aWR0aDogNiU7XG4gIGJvdHRvbTogMTAwcHg7XG4gIGxlZnQ6IDA7XG4gIGhlaWdodDogYXV0bztcbiAgb3ZlcmZsb3c6IHZpc2libGU7XG4gIHBhZGRpbmc6IDAgMCAwIDA7XG4gIG1hcmdpbjogMCAwIDAgMDtcbiAgei1pbmRleDogMTAwO1xuXG59XG5cbi5sZWdlbmQtb3ZlcmxheSAubGVnZW5kLW92ZXJsYXktaW5uZXIge1xuICBjb2xvcjogcmdiYSgxNywgMTcsIDE3LCAwLjgpO1xuICBwYWRkaW5nOiAwO1xuICBvdmVyZmxvdzogdmlzaWJsZTtcbiAgXG59XG4ubGVnZW5kLW92ZXJsYXktaW5uZXIgdGFibGUgdGQge1xuICB0ZXh0LXRyYW5zZm9ybTogY2FwaXRhbGl6ZTtcbn1cbi5saW5lX2JyZWFre1xuICBwYWRkaW5nOiAwLjVweDtcbiAgYm9yZGVyOiBub25lOyAgXG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCBncmF5OyBcbn1cblxuIiwiLmZha2UtbGVhZmxldC1jb250cm9sLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWNvbG91cnMsXG5ib2R5IC51aS1zaWRlYmFyLFxuI2xheWVyLWxlZ2VuZHMgLmxlZ2VuZCxcbi5sYXllci12YWx1ZXMtcG9wdXAgLmxlYWZsZXQtcG9wdXAtY29udGVudC13cmFwcGVyLFxuLmxheWVyLXZhbHVlcy1wb3B1cCAubGVhZmxldC1wb3B1cC10aXAsXG4jc2ltdWxhdGlvbi1wbGF5IHtcbiAgY29sb3I6ICMzMzM7XG4gIGJhY2tncm91bmQ6ICNmZmY7XG4gIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgYm94LXNoYWRvdzogMCAwIDAgMnB4IHJnYmEoMCwgMCwgMCwgMC4xKTtcbiAgYm9yZGVyOiBub25lO1xuICBiYWNrZ3JvdW5kLWNsaXA6IHBhZGRpbmctYm94OyB9XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbC5hY3RpdmUsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcuYWN0aXZlLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWNvbG91cnMuYWN0aXZlLFxuYm9keSAuYWN0aXZlLnVpLXNpZGViYXIsXG4jbGF5ZXItbGVnZW5kcyAuYWN0aXZlLmxlZ2VuZCxcbi5sYXllci12YWx1ZXMtcG9wdXAgLmFjdGl2ZS5sZWFmbGV0LXBvcHVwLWNvbnRlbnQtd3JhcHBlcixcbi5sYXllci12YWx1ZXMtcG9wdXAgLmFjdGl2ZS5sZWFmbGV0LXBvcHVwLXRpcCxcbi5hY3RpdmUjc2ltdWxhdGlvbi1wbGF5IHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzAwN2FkOTtcbiAgYm94LXNoYWRvdzogMCAwIDAgMnB4IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgY29sb3I6ICNmZmZmZmY7IH1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIHtcbiAgbWFyZ2luLWJvdHRvbTogMTBweDtcbiAgcG9zaXRpb246IHJlbGF0aXZlOyB9XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbCB7XG4gIGhlaWdodDogMzBweDtcbiAgd2lkdGg6IDMwcHg7IH1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIHtcbiAgaGVpZ2h0OiA0NHB4O1xuICB3aWR0aDogNDRweDsgfVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wgYSxcbi5mYWtlLWxlYWZsZXQtY29udHJvbC1sZyBhIHtcbiAgY29sb3I6IGluaGVyaXQ7XG4gIGhlaWdodDogMTAwJTtcbiAgd2lkdGg6IDEwMCU7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBsaW5lLWhlaWdodDogMDsgfVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2w6aG92ZXIsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGc6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjRmNGY0OyB9XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbCBhOmhvdmVyLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIGE6aG92ZXIge1xuICBjb2xvcjogIzMzMztcbiAgY3Vyc29yOiBwb2ludGVyOyB9XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbC5hY3RpdmU6aG92ZXIsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcuYWN0aXZlOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzE3NzViZDsgfVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wuYWN0aXZlIGE6aG92ZXIsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcuYWN0aXZlIGE6aG92ZXIsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtY29sb3Vycy5hY3RpdmUgYTpob3ZlcixcbmJvZHkgLmFjdGl2ZS51aS1zaWRlYmFyIGE6aG92ZXIsXG4jbGF5ZXItbGVnZW5kcyAuYWN0aXZlLmxlZ2VuZCBhOmhvdmVyLFxuLmxheWVyLXZhbHVlcy1wb3B1cCAuYWN0aXZlLmxlYWZsZXQtcG9wdXAtY29udGVudC13cmFwcGVyIGE6aG92ZXIsXG4ubGF5ZXItdmFsdWVzLXBvcHVwIC5hY3RpdmUubGVhZmxldC1wb3B1cC10aXAgYTpob3Zlcixcbi5hY3RpdmUjc2ltdWxhdGlvbi1wbGF5IGE6aG92ZXIge1xuICBjb2xvcjogI2ZmZmZmZjsgfVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wgZmEtaWNvbi5uZy1mYS1pY29uLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIGZhLWljb24ubmctZmEtaWNvbiB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgdG9wOiA1MCU7XG4gIGxlZnQ6IDUwJTtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7IH1cblxuLmZha2UtbGVhZmxldC1jb250cm9sIGEge1xuICBmb250LXNpemU6IDEycHg7IH1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIGEge1xuICBmb250LXNpemU6IDI0cHg7IH1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIHNwYW4ge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogNTAlO1xuICBsZWZ0OiA1MCU7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpOyB9XG5cbioge1xuICBib3gtc2l6aW5nOiBib3JkZXItYm94OyB9XG5cbmJvZHksXG5odG1sIHtcbiAgZm9udC1mYW1pbHk6IFJvYm90bywgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmICFpbXBvcnRhbnQ7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgbWFyZ2luOiAwO1xuICBwYWRkaW5nOiAwOyB9XG5cbi5jMyB0ZXh0IHtcbiAgZm9udC1mYW1pbHk6IFJvYm90bywgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmICFpbXBvcnRhbnQ7XG4gIGZvbnQtc2l6ZTogMTRweDsgfVxuXG5oMSxcbi5oMSB7XG4gIGZvbnQtc2l6ZTogMjRweDtcbiAgZm9udC13ZWlnaHQ6IDYwMDsgfVxuXG5oMixcbi5oMiB7XG4gIGZvbnQtc2l6ZTogMThweDtcbiAgZm9udC13ZWlnaHQ6IDUwMDsgfVxuXG5wcmUge1xuICB3b3JkLWJyZWFrOiBicmVhay13b3JkO1xuICBvdmVyZmxvdy14OiBhdXRvO1xuICB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7XG4gIHdoaXRlLXNwYWNlOiAtbW96LXByZS13cmFwO1xuICB3aGl0ZS1zcGFjZTogLXByZS13cmFwO1xuICB3aGl0ZS1zcGFjZTogLW8tcHJlLXdyYXA7XG4gIHdvcmQtd3JhcDogYnJlYWstd29yZDsgfVxuXG4uZm9udC1pdGFsaWMtbGlnaHQge1xuICBmb250LXdlaWdodDogMTAwO1xuICBmb250LXN0eWxlOiBpdGFsaWM7IH1cblxuLnRleHQtb3ZlcmZsb3ctZWxsaXBzaXMge1xuICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICBvdmVyZmxvdzogaGlkZGVuO1xuICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpczsgfVxuXG4ubGFiZWwsXG5sYWJlbCB7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBtYXJnaW4tYm90dG9tOiAxMHB4O1xuICBtYXJnaW4tdG9wOiAyMHB4OyB9XG5cbi5iYWRnZSA+IC5waSB7XG4gIHBhZGRpbmctcmlnaHQ6IDRweDsgfVxuXG5hLmljb24tbGluazpsYXN0LW9mLXR5cGUge1xuICBwYWRkaW5nLXJpZ2h0OiAxMHB4OyB9XG5cbmEuaWNvbi1saW5rOmZpcnN0LW9mLXR5cGUge1xuICBwYWRkaW5nLWxlZnQ6IDEwcHg7IH1cblxuYS5pY29uLWxpbmsge1xuICBmb250LXNpemU6IDAuODVlbTtcbiAgcGFkZGluZzogMCA1cHg7IH1cblxuYm9keSAudWktd2lkZ2V0LW92ZXJsYXkge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuMik7XG4gIHRyYW5zaXRpb246IGFsbCBsaW5lYXIgMC4yczsgfVxuXG4udWktc3RhdGUtaGlnaGxpZ2h0IGEuaWNvbi1saW5rIHtcbiAgY29sb3I6ICNmZmZmZmY7IH1cblxuLnVpLXN0YXRlLWhpZ2hsaWdodCBhLmljb24tbGluazpob3ZlciB7XG4gIGNvbG9yOiAjZmZmZmZmYmE7IH1cblxuLmVtcHR5LXBsYWNlaG9sZGVyIHtcbiAgY29sb3I6ICM5OTk7XG4gIGZvbnQtd2VpZ2h0OiAxMDA7XG4gIHBhZGRpbmc6IDIwcHggMDtcbiAgLyogaGVpZ2h0OiAxMDAlOyAqL1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7IH1cblxuLnVpLXRvYXN0IHtcbiAgbWF4LWhlaWdodDogMTAwdmg7XG4gIG92ZXJmbG93LXk6IGF1dG87IH1cblxuLnVpLXRvYXN0LWRldGFpbCB7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7IH1cblxuLm1vZGFsLWRpYWxvZy51aS1kaWFsb2cge1xuICB3aWR0aDogNDAwcHg7IH1cblxuLnVpLWRpYWxvZyAudWktZ3JpZCAudWktZ3JpZC1yb3cge1xuICBtYXJnaW4tYm90dG9tOiAxMHB4OyB9XG5cbi51aS1kaWFsb2cgLnVpLWxpc3Rib3ggLnVpLWxpc3Rib3gtbGlzdC13cmFwcGVyIHtcbiAgbWF4LWhlaWdodDogY2FsYygxMDB2aCAtIDQwMHB4KTtcbiAgbWluLWhlaWdodDogMTAwcHg7IH1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctY29udGVudCB7XG4gIG1heC1oZWlnaHQ6IGNhbGMoMTAwdmggLSAyMDBweCk7XG4gIG1pbi1oZWlnaHQ6IDIwMHB4O1xuICBvdmVyZmxvdy15OiBhdXRvO1xuICBvdmVyZmxvdy15OiBvdmVybGF5O1xuICAtbXMtb3ZlcmZsb3ctc3R5bGU6IC1tcy1hdXRvaGlkaW5nLXNjcm9sbGJhcjtcbiAgYm9yZGVyLWxlZnQ6IG5vbmU7XG4gIGJvcmRlci1yaWdodDogbm9uZTsgfVxuXG5ib2R5IC51aS1kaWFsb2cgLnVpLWRpYWxvZy10aXRsZWJhcixcbmJvZHkgLnVpLWRpYWxvZyAudWktZGlhbG9nLWZvb3RlciB7XG4gIGJvcmRlci1sZWZ0OiBub25lO1xuICBib3JkZXItcmlnaHQ6IG5vbmU7IH1cblxuYm9keSAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXIge1xuICBib3JkZXItdG9wOiBub25lOyB9XG5cbmJvZHkgLnVpLWRpYWxvZyAudWktZGlhbG9nLWZvb3RlciB7XG4gIGJvcmRlci1ib3R0b206IG5vbmU7IH1cblxuLnVpLWRpYWxvZyAudWktbGlzdGJveCAudWktcHJvZ3Jlc3NiYXIge1xuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDE0cHg7XG4gIG1hcmdpbi10b3A6IDNweDtcbiAgbWFyZ2luLWJvdHRvbTogLTNweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzAwMDAwMDRhOyB9XG5cbi51aS1kaWFsb2cgLnVpLWxpc3Rib3ggLnVpLXByb2dyZXNzYmFyIC51aS1wcm9ncmVzc2Jhci1sYWJlbCB7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgbGluZS1oZWlnaHQ6IDEuMjU7XG4gIGNvbG9yOiBpbmhlcml0OyB9XG5cbi51aS1kaWFsb2cgLnVpLWxpc3Rib3ggLnVpLXByb2dyZXNzYmFyIC51aS1wcm9ncmVzc2Jhci12YWx1ZSB7XG4gIGJhY2tncm91bmQ6ICMwMDAwMDA2YjsgfVxuXG5ib2R5IC51aS13aWRnZXQsXG5ib2R5IC51aS1hdXRvY29tcGxldGUudWktYXV0b2NvbXBsZXRlLW11bHRpcGxlIC51aS1hdXRvY29tcGxldGUtbXVsdGlwbGUtY29udGFpbmVyIC51aS1hdXRvY29tcGxldGUtaW5wdXQtdG9rZW4gaW5wdXQsXG5ib2R5IC51aS1jaGlwcyA+IHVsLnVpLWlucHV0dGV4dCAudWktY2hpcHMtaW5wdXQtdG9rZW4gaW5wdXQsXG5ib2R5IC51aS10YWJsZSAudWktZWRpdGFibGUtY29sdW1uIGlucHV0LFxuYm9keSAudWktdHJlZXRhYmxlIC51aS1lZGl0YWJsZS1jb2x1bW4gaW5wdXQsXG5ib2R5IC51aS10ZXJtaW5hbCAudWktdGVybWluYWwtaW5wdXQge1xuICBmb250LWZhbWlseTogUm9ib3RvLCBcIkhlbHZldGljYSBOZXVlXCIsIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWYgIWltcG9ydGFudDsgfVxuXG5ib2R5IC5zZWNvbmRhcnktY29sLCBib2R5IC51aS1vcmRlcmxpc3QgLnVpLW9yZGVybGlzdC1jb250cm9scyBidXR0b24sXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc2Vjb25kYXJ5LFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zZWNvbmRhcnkgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogIzMzMzMzMztcbiAgYmFja2dyb3VuZC1jb2xvcjogI2U4ZThlODtcbiAgYm9yZGVyLWNvbG9yOiAjZThlOGU4OyB9XG5cbmJvZHkgLnNlY29uZGFyeS1jb2w6aG92ZXIsIGJvZHkgLnVpLW9yZGVybGlzdCAudWktb3JkZXJsaXN0LWNvbnRyb2xzIGJ1dHRvbjpob3ZlcixcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1zZWNvbmRhcnk6ZW5hYmxlZDpob3ZlcixcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc2Vjb25kYXJ5ID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjYzhjOGM4O1xuICBjb2xvcjogIzMzMzMzMztcbiAgYm9yZGVyLWNvbG9yOiAjYzhjOGM4OyB9XG5cbmJvZHkgLnNlY29uZGFyeS1jb2w6ZW5hYmxlZDpmb2N1cywgYm9keSAudWktb3JkZXJsaXN0IC51aS1vcmRlcmxpc3QtY29udHJvbHMgYnV0dG9uOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc2Vjb25kYXJ5OmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLXNlY29uZGFyeSA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjOGRjZGZmO1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICM4ZGNkZmY7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICM4ZGNkZmY7IH1cblxuYm9keSAuc2Vjb25kYXJ5LWNvbDphY3RpdmUsIGJvZHkgLnVpLW9yZGVybGlzdCAudWktb3JkZXJsaXN0LWNvbnRyb2xzIGJ1dHRvbjphY3RpdmUsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc2Vjb25kYXJ5OmVuYWJsZWQ6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zZWNvbmRhcnkgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjYTBhMGEwO1xuICBjb2xvcjogIzMzMzMzMztcbiAgYm9yZGVyLWNvbG9yOiAjYTBhMGEwOyB9XG5cbmJvZHkgLmRlZmF1bHQtY29sLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWluZm8sXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWluZm8gPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzAwN2FkOTtcbiAgYm9yZGVyLWNvbG9yOiAjMDA3YWQ5OyB9XG5cbmJvZHkgLmRlZmF1bHQtY29sOmhvdmVyLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWluZm86ZW5hYmxlZDpob3ZlcixcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24taW5mbyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzExNmZiZjtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogIzExNmZiZjsgfVxuXG5ib2R5IC5kZWZhdWx0LWNvbDplbmFibGVkOmZvY3VzLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWluZm86ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24taW5mbyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjOGRjZGZmO1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICM4ZGNkZmY7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICM4ZGNkZmY7IH1cblxuYm9keSAuZGVmYXVsdC1jb2w6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWluZm86ZW5hYmxlZDphY3RpdmUsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWluZm8gPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA1YjlmO1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgYm9yZGVyLWNvbG9yOiAjMDA1YjlmOyB9XG5cbmJvZHkgLnN1Y2Nlc3MtY29sLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3MsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLXN1Y2Nlc3MgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzM0YTgzNTtcbiAgYm9yZGVyLWNvbG9yOiAjMzRhODM1OyB9XG5cbmJvZHkgLnN1Y2Nlc3MtY29sOmhvdmVyLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3M6ZW5hYmxlZDpob3ZlcixcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2VzcyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzEwN2QxMTtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogIzEwN2QxMTsgfVxuXG5ib2R5IC5zdWNjZXNzLWNvbDplbmFibGVkOmZvY3VzLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3M6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tc3VjY2VzcyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjYWFlNWFhO1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNhYWU1YWE7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNhYWU1YWE7IH1cblxuYm9keSAuc3VjY2Vzcy1jb2w6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXN1Y2Nlc3M6ZW5hYmxlZDphY3RpdmUsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLXN1Y2Nlc3MgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMGM2YjBkO1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgYm9yZGVyLWNvbG9yOiAjMGM2YjBkOyB9XG5cbmJvZHkgLnN1Y2Nlc3MtY29sLW91dGxpbmUsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lLFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zdWNjZXNzLW91dGxpbmUgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogIzM0YTgzNTtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgYm9yZGVyLWNvbG9yOiAjZmZmOyB9XG5cbmJvZHkgLnN1Y2Nlc3MtY29sLW91dGxpbmU6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lOmVuYWJsZWQ6aG92ZXIsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZSA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgY29sb3I6ICMxMDdkMTE7XG4gIGJvcmRlci1jb2xvcjogI2ZmZjsgfVxuXG5ib2R5IC5zdWNjZXNzLWNvbC1vdXRsaW5lOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLXN1Y2Nlc3Mtb3V0bGluZSA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjYWFlNWFhO1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNhYWU1YWE7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNhYWU1YWE7IH1cblxuYm9keSAuc3VjY2Vzcy1jb2wtb3V0bGluZTphY3RpdmUsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tc3VjY2Vzcy1vdXRsaW5lOmVuYWJsZWQ6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1zdWNjZXNzLW91dGxpbmUgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xuICBjb2xvcjogIzBjNmIwZDtcbiAgYm9yZGVyLWNvbG9yOiAjZmZmOyB9XG5cbmJvZHkgLndhcm5pbmctY29sLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXdhcm5pbmcsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLXdhcm5pbmcgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogIzMzMzMzMztcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmYmEwMTtcbiAgYm9yZGVyLWNvbG9yOiAjZmZiYTAxOyB9XG5cbmJvZHkgLndhcm5pbmctY29sOmhvdmVyLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXdhcm5pbmc6ZW5hYmxlZDpob3ZlcixcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24td2FybmluZyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2VkOTkwYjtcbiAgY29sb3I6ICMzMzMzMzM7XG4gIGJvcmRlci1jb2xvcjogI2VkOTkwYjsgfVxuXG5ib2R5IC53YXJuaW5nLWNvbDplbmFibGVkOmZvY3VzLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXdhcm5pbmc6ZW5hYmxlZDpmb2N1cyxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24td2FybmluZyA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZmZlYWI0O1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmZmVhYjQ7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmZmVhYjQ7IH1cblxuYm9keSAud2FybmluZy1jb2w6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLXdhcm5pbmc6ZW5hYmxlZDphY3RpdmUsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLXdhcm5pbmcgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZDM4YjEwO1xuICBjb2xvcjogIzMzMzMzMztcbiAgYm9yZGVyLWNvbG9yOiAjZDM4YjEwOyB9XG5cbmJvZHkgLmRhbmdlci1jb2wsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyLFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXIgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2U5MTIyNDtcbiAgYm9yZGVyLWNvbG9yOiAjZTkxMjI0OyB9XG5cbmJvZHkgLmRhbmdlci1jb2w6aG92ZXIsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyOmVuYWJsZWQ6aG92ZXIsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlciA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2MwMTEyMDtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGJvcmRlci1jb2xvcjogI2MwMTEyMDsgfVxuXG5ib2R5IC5kYW5nZXItY29sOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlciA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmZvY3VzIHtcbiAgLXdlYmtpdC1ib3gtc2hhZG93OiAwIDAgMCAwLjJlbSAjZjliNGJhO1xuICAtbW96LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7IH1cblxuYm9keSAuZGFuZ2VyLWNvbDphY3RpdmUsXG5ib2R5IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdC51aS1idXR0b24tZGFuZ2VyOmVuYWJsZWQ6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXIgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQ6ZW5hYmxlZDphY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjYTkwMDAwO1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgYm9yZGVyLWNvbG9yOiAjYTkwMDAwOyB9XG5cbmJvZHkgLmRhbmdlci1jb2wtb3V0bGluZSxcbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZSxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmUgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBjb2xvcjogI2U5MTIyNDtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgYm9yZGVyLWNvbG9yOiAjZmZmOyB9XG5cbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZSxcbmJvZHkgLnVpLWJ1dHRvbnNldC51aS1idXR0b24tZGFuZ2VyLW91dGxpbmUgPiAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQge1xuICBib3JkZXItY29sb3I6ICNlOTEyMjQ7IH1cblxuYm9keSAuZGFuZ2VyLWNvbC1vdXRsaW5lOmhvdmVyLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lOmVuYWJsZWQ6aG92ZXIsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xuICBjb2xvcjogI2MwMTEyMDtcbiAgYm9yZGVyLWNvbG9yOiAjZmZmOyB9XG5cbmJvZHkgLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZTplbmFibGVkOmhvdmVyLFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZSA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmhvdmVyIHtcbiAgYm9yZGVyLWNvbG9yOiAjYzAxMTIwOyB9XG5cbmJvZHkgLmRhbmdlci1jb2wtb3V0bGluZTplbmFibGVkOmZvY3VzLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lOmVuYWJsZWQ6Zm9jdXMsXG5ib2R5IC51aS1idXR0b25zZXQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lID4gLnVpLWJ1dHRvbi51aS1zdGF0ZS1kZWZhdWx0OmVuYWJsZWQ6Zm9jdXMge1xuICAtd2Via2l0LWJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7XG4gIC1tb3otYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2Y5YjRiYTtcbiAgYm94LXNoYWRvdzogMCAwIDAgMC4yZW0gI2Y5YjRiYTsgfVxuXG5ib2R5IC5kYW5nZXItY29sLW91dGxpbmU6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lOmVuYWJsZWQ6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZSA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmFjdGl2ZSB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGNvbG9yOiAjYTkwMDAwO1xuICBib3JkZXItY29sb3I6ICNmZmY7IH1cblxuYm9keSAudWktYnV0dG9uLnVpLXN0YXRlLWRlZmF1bHQudWktYnV0dG9uLWRhbmdlci1vdXRsaW5lOmVuYWJsZWQ6YWN0aXZlLFxuYm9keSAudWktYnV0dG9uc2V0LnVpLWJ1dHRvbi1kYW5nZXItb3V0bGluZSA+IC51aS1idXR0b24udWktc3RhdGUtZGVmYXVsdDplbmFibGVkOmFjdGl2ZSB7XG4gIGJvcmRlci1jb2xvcjogI2E5MDAwMDsgfVxuXG5ib2R5IC51aS1kaWFsb2cgLnVpLWRpYWxvZy1mb290ZXIgYnV0dG9uLFxuYm9keSAudWktY2FyZCAudWktY2FyZC1mb290ZXIgYnV0dG9uIHtcbiAgbWFyZ2luOiAwIDAgMCAwLjVlbSAhaW1wb3J0YW50OyB9XG5cbmJvZHkgLnVpLWRpYWxvZyB7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDJweCByZ2JhKDAsIDAsIDAsIDAuMSkgIWltcG9ydGFudDsgfVxuXG5ib2R5IC51aS1kaWFsb2cgLnVpLWRpYWxvZy10aXRsZWJhciB7XG4gIGJvcmRlci1yYWRpdXM6IDRweCA0cHggMCAwOyB9XG5cbmJvZHkgLnVpLWRpYWxvZyAudWktZGlhbG9nLWZvb3RlciB7XG4gIGJvcmRlci1yYWRpdXM6IDAgMCA0cHggNHB4OyB9XG5cbmJvZHkgLnVpLW1lc3NhZ2VzLWVycm9yIHtcbiAgYm9yZGVyOiBub25lO1xuICBmb250LXdlaWdodDogODAwO1xuICBwYWRkaW5nOiAwO1xuICBkaXNwbGF5OiBibG9jaztcbiAgd2lkdGg6IDEwMCU7XG4gIHRleHQtYWxpZ246IHJpZ2h0O1xuICBjb2xvcjogI2E4MDAwMDsgfVxuXG5ib2R5IC5uZy1kaXJ0eS5uZy1pbnZhbGlkICsgdWwge1xuICBwYWRkaW5nLWlubGluZS1zdGFydDogMDsgfVxuXG5ib2R5IC51aS1pbnB1dHRleHQubmctaW52YWxpZDplbmFibGVkOmZvY3VzLFxuLnVpLWlucHV0dGV4dCB7XG4gIGJvcmRlci1jb2xvcjogI2E4MDAwMDsgfVxuXG5ib2R5IC51aS1pbnB1dHRleHQsXG5ib2R5IC51aS1pbnB1dGdyb3VwIC51aS1pbnB1dHRleHQubmctZGlydHkubmctaW52YWxpZCArIC51aS1pbnB1dGdyb3VwLWFkZG9uIHtcbiAgdHJhbnNpdGlvbjogYm94LXNoYWRvdyAwLjJzOyB9XG5cbmJvZHkgLnVpLWlucHV0dGV4dC5uZy1kaXJ0eS5uZy1pbnZhbGlkLFxuYm9keSBwLWRyb3Bkb3duLm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktZHJvcGRvd24sXG5ib2R5IHAtYXV0b2NvbXBsZXRlLm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktYXV0b2NvbXBsZXRlID4gLnVpLWlucHV0dGV4dCxcbmJvZHkgcC1jYWxlbmRhci5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLWNhbGVuZGFyID4gLnVpLWlucHV0dGV4dCxcbmJvZHkgcC1jaGlwcy5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLWlucHV0dGV4dCxcbmJvZHkgcC1pbnB1dG1hc2submctZGlydHkubmctaW52YWxpZCA+IC51aS1pbnB1dHRleHQsXG5ib2R5IHAtY2hlY2tib3gubmctZGlydHkubmctaW52YWxpZCAudWktY2hrYm94LWJveCxcbmJvZHkgcC1yYWRpb2J1dHRvbi5uZy1kaXJ0eS5uZy1pbnZhbGlkIC51aS1yYWRpb2J1dHRvbi1ib3gsXG5ib2R5IHAtaW5wdXRzd2l0Y2gubmctZGlydHkubmctaW52YWxpZCAudWktaW5wdXRzd2l0Y2gsXG5ib2R5IHAtbGlzdGJveC5uZy1kaXJ0eS5uZy1pbnZhbGlkIC51aS1pbnB1dHRleHQsXG5ib2R5IHAtbXVsdGlzZWxlY3QubmctZGlydHkubmctaW52YWxpZCA+IC51aS1tdWx0aXNlbGVjdCxcbmJvZHkgcC1zcGlubmVyLm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktaW5wdXR0ZXh0LFxuYm9keSBwLXNlbGVjdGJ1dHRvbi5uZy1kaXJ0eS5uZy1pbnZhbGlkIC51aS1idXR0b24sXG5ib2R5IHAtdG9nZ2xlYnV0dG9uLm5nLWRpcnR5Lm5nLWludmFsaWQgLnVpLWJ1dHRvbiB7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuMmVtICNmOWI0YmE7IH1cblxuYm9keSAudWktaW5wdXRncm91cCAudWktaW5wdXR0ZXh0Lm5nLWRpcnR5Lm5nLWludmFsaWQgKyAudWktaW5wdXRncm91cC1hZGRvbiB7XG4gIGJveC1zaGFkb3c6IDJweCAtMi44cHggMCAjZjliNGJhLCAycHggMi44cHggMCAjZjliNGJhOyB9XG5cbmJvZHkgcC1jYWxlbmRhci5uZy1kaXJ0eS5uZy1pbnZhbGlkID4gLnVpLWNhbGVuZGFyLnVpLWNhbGVuZGFyLXctYnRuIHtcbiAgYm94LXNoYWRvdzogMCAwIDAgM3B4ICNmOWI0YmE7XG4gIGJvcmRlci1yYWRpdXM6IDRweDsgfVxuXG5ib2R5IC51aS1pbnB1dGdyb3VwIC51aS1pbnB1dHRleHQ6ZW5hYmxlZDpmb2N1czpub3QoLnVpLXN0YXRlLWVycm9yKSArIC51aS1pbnB1dGdyb3VwLWFkZG9uLFxuYm9keSBwLWNhbGVuZGFyLm5nLWRpcnR5Lm5nLWludmFsaWQgPiAudWktY2FsZW5kYXIgPiAudWktaW5wdXR0ZXh0OmVuYWJsZWQ6Zm9jdXM6bm90KC51aS1zdGF0ZS1lcnJvciksXG5ib2R5IHAtY2FsZW5kYXIubmctZGlydHkubmctaW52YWxpZCA+IC51aS1jYWxlbmRhciA+IC51aS1pbnB1dHRleHQ6ZW5hYmxlZDpmb2N1czpub3QoLnVpLXN0YXRlLWVycm9yKSArIC51aS1jYWxlbmRhci1idXR0b24ge1xuICBib3gtc2hhZG93OiBub25lOyB9XG5cbio6bm90KC51aS1jYWxlbmRhcikgLnVpLWlucHV0dGV4dCB7XG4gIHdpZHRoOiAxMDAlOyB9XG5cbmJvZHkgLnVpLXN0YXRlLWRpc2FibGVkLFxuYm9keSAudWktd2lkZ2V0OmRpc2FibGVkIHtcbiAgY3Vyc29yOiBub3QtYWxsb3dlZDsgfVxuXG4uZm9ybSBkeW5hbWljLXByaW1lbmctZm9ybS1jb250cm9sID4gZGl2IHtcbiAgbWFyZ2luLWJvdHRvbTogMTBweDsgfVxuXG4uZm9ybSAudWktY2FsZW5kYXIsXG4uZm9ybSAudWktc3Bpbm5lciB7XG4gIHdpZHRoOiAxMDAlOyB9XG5cbi5mb3JtIC51aS1jYWxlbmRhci13LWJ0biBpbnB1dC51aS1pbnB1dHRleHQge1xuICB3aWR0aDogY2FsYygxMDAlIC0gMzNweCk7IH1cblxuLmZvcm0gLnVpLWRhdGVwaWNrZXIge1xuICBwYWRkaW5nOiAwLjVlbTsgfVxuXG4uZm9ybSAudWktZGF0ZXBpY2tlciB7XG4gIGZvbnQtc2l6ZTogMTJweDsgfVxuXG4uZm9ybSAudWktZGF0ZXBpY2tlciAudWktdGltZXBpY2tlciB7XG4gIHBhZGRpbmc6IDEwcHggMCAwIDA7XG4gIGZvbnQtc2l6ZTogMTFweDsgfVxuXG4uZm9ybSAudWktZGF0ZXBpY2tlciB0YWJsZSB7XG4gIGZvbnQtc2l6ZTogMTFweDsgfVxuXG4vKiB3aWR0aCAqL1xuOjotd2Via2l0LXNjcm9sbGJhciB7XG4gIHdpZHRoOiAxMHB4OyB9XG5cbi8qIFRyYWNrICovXG46Oi13ZWJraXQtc2Nyb2xsYmFyLXRyYWNrIHtcbiAgYmFja2dyb3VuZDogbm9uZTsgfVxuXG4vKiBIYW5kbGUgKi9cbjo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWIge1xuICBiYWNrZ3JvdW5kOiAjMDAwMDAwMzM7XG4gIGJvcmRlcjogMnB4IHNvbGlkIHJnYmEoMCwgMCwgMCwgMCk7XG4gIGJhY2tncm91bmQtY2xpcDogcGFkZGluZy1ib3g7XG4gIGJvcmRlci1yYWRpdXM6IDVweDsgfVxuXG4vKiBIYW5kbGUgb24gaG92ZXIgKi9cbjo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWI6aG92ZXIge1xuICBiYWNrZ3JvdW5kOiAjMDAwMDAwNTU7XG4gIGJhY2tncm91bmQtY2xpcDogcGFkZGluZy1ib3g7IH1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWNvbG91cnMsXG5ib2R5IC51aS1zaWRlYmFyLFxuI2xheWVyLWxlZ2VuZHMgLmxlZ2VuZCxcbi5sYXllci12YWx1ZXMtcG9wdXAgLmxlYWZsZXQtcG9wdXAtY29udGVudC13cmFwcGVyLFxuLmxheWVyLXZhbHVlcy1wb3B1cCAubGVhZmxldC1wb3B1cC10aXAsXG4jc2ltdWxhdGlvbi1wbGF5IHtcbiAgY29sb3I6ICMzMzM7XG4gIGJhY2tncm91bmQ6ICNmZmY7XG4gIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgYm94LXNoYWRvdzogMCAwIDAgMnB4IHJnYmEoMCwgMCwgMCwgMC4xKTtcbiAgYm9yZGVyOiBub25lO1xuICBiYWNrZ3JvdW5kLWNsaXA6IHBhZGRpbmctYm94OyB9XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbC5hY3RpdmUsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcuYWN0aXZlLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWNvbG91cnMuYWN0aXZlLFxuYm9keSAuYWN0aXZlLnVpLXNpZGViYXIsXG4jbGF5ZXItbGVnZW5kcyAuYWN0aXZlLmxlZ2VuZCxcbi5sYXllci12YWx1ZXMtcG9wdXAgLmFjdGl2ZS5sZWFmbGV0LXBvcHVwLWNvbnRlbnQtd3JhcHBlcixcbi5sYXllci12YWx1ZXMtcG9wdXAgLmFjdGl2ZS5sZWFmbGV0LXBvcHVwLXRpcCxcbi5hY3RpdmUjc2ltdWxhdGlvbi1wbGF5IHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzAwN2FkOTtcbiAgYm94LXNoYWRvdzogMCAwIDAgMnB4IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgY29sb3I6ICNmZmZmZmY7IH1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIHtcbiAgbWFyZ2luLWJvdHRvbTogMTBweDtcbiAgcG9zaXRpb246IHJlbGF0aXZlOyB9XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbCB7XG4gIGhlaWdodDogMzBweDtcbiAgd2lkdGg6IDMwcHg7IH1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIHtcbiAgaGVpZ2h0OiA0NHB4O1xuICB3aWR0aDogNDRweDsgfVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wgYSxcbi5mYWtlLWxlYWZsZXQtY29udHJvbC1sZyBhIHtcbiAgY29sb3I6IGluaGVyaXQ7XG4gIGhlaWdodDogMTAwJTtcbiAgd2lkdGg6IDEwMCU7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBsaW5lLWhlaWdodDogMDsgfVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2w6aG92ZXIsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGc6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjRmNGY0OyB9XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbCBhOmhvdmVyLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIGE6aG92ZXIge1xuICBjb2xvcjogIzMzMztcbiAgY3Vyc29yOiBwb2ludGVyOyB9XG5cbi5mYWtlLWxlYWZsZXQtY29udHJvbC5hY3RpdmU6aG92ZXIsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcuYWN0aXZlOmhvdmVyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzE3NzViZDsgfVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wuYWN0aXZlIGE6aG92ZXIsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtbGcuYWN0aXZlIGE6aG92ZXIsXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wtY29sb3Vycy5hY3RpdmUgYTpob3ZlcixcbmJvZHkgLmFjdGl2ZS51aS1zaWRlYmFyIGE6aG92ZXIsXG4jbGF5ZXItbGVnZW5kcyAuYWN0aXZlLmxlZ2VuZCBhOmhvdmVyLFxuLmxheWVyLXZhbHVlcy1wb3B1cCAuYWN0aXZlLmxlYWZsZXQtcG9wdXAtY29udGVudC13cmFwcGVyIGE6aG92ZXIsXG4ubGF5ZXItdmFsdWVzLXBvcHVwIC5hY3RpdmUubGVhZmxldC1wb3B1cC10aXAgYTpob3Zlcixcbi5hY3RpdmUjc2ltdWxhdGlvbi1wbGF5IGE6aG92ZXIge1xuICBjb2xvcjogI2ZmZmZmZjsgfVxuXG4uZmFrZS1sZWFmbGV0LWNvbnRyb2wgZmEtaWNvbi5uZy1mYS1pY29uLFxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIGZhLWljb24ubmctZmEtaWNvbiB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgdG9wOiA1MCU7XG4gIGxlZnQ6IDUwJTtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7IH1cblxuLmZha2UtbGVhZmxldC1jb250cm9sIGEge1xuICBmb250LXNpemU6IDEycHg7IH1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIGEge1xuICBmb250LXNpemU6IDI0cHg7IH1cblxuLmZha2UtbGVhZmxldC1jb250cm9sLWxnIHNwYW4ge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogNTAlO1xuICBsZWZ0OiA1MCU7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpOyB9XG5cbmJvZHkgLnVpLXNpZGViYXIge1xuICB6LWluZGV4OiAxNDAwICFpbXBvcnRhbnQ7XG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjNzIGN1YmljLWJlemllcigwLjQ1NSwgMC4wMywgMC41MTUsIDAuOTU1KTtcbiAgcGFkZGluZzogMDtcbiAgYm9yZGVyLXJhZGl1czogMDsgfVxuXG5ib2R5IC51aS1zaWRlYmFyLWJvdHRvbSB7XG4gIGJveC1zaGFkb3c6IDAgLThweCAwcHggMnB4IHJnYmEoMCwgMCwgMCwgMC4yKTsgfVxuXG5ib2R5IC51aS1zaWRlYmFyLWJvdHRvbSxcbmJvZHkgLnVpLXNpZGViYXItdG9wIHtcbiAgaGVpZ2h0OiAzMjBweDsgfVxuXG5ib2R5IC51aS1zaWRlYmFyLWxlZnQsXG5ib2R5IC51aS1zaWRlYmFyLXJpZ2h0IHtcbiAgd2lkdGg6IDMxM3B4OyB9XG5cbi51aS1zaWRlYmFyLndpZHRoLWZpdC1jb250ZW50IHtcbiAgd2lkdGg6IGZpdC1jb250ZW50OyB9XG5cbi51aS1zaWRlYmFyLmhlaWdodC1maXQtY29udGVudCB7XG4gIGhlaWdodDogZml0LWNvbnRlbnQ7IH1cblxuLnVpLXNpZGViYXIud2lkdGgtZml0LWNvbnRlbnQgLnNpZGViYXItY29udGFpbmVyIHtcbiAgbWluLXdpZHRoOiAzMTNweDtcbiAgbWF4LXdpZHRoOiAxMDB2dzsgfVxuXG4uc2lkZWJhci1jb250YWluZXIge1xuICBoZWlnaHQ6IGNhbGMoMTAwJSAtIDUzcHgpO1xuICBvdmVyZmxvdy15OiBhdXRvO1xuICBvdmVyZmxvdy15OiBvdmVybGF5O1xuICAtbXMtb3ZlcmZsb3ctc3R5bGU6IC1tcy1hdXRvaGlkaW5nLXNjcm9sbGJhcjtcbiAgb3ZlcmZsb3cteDogaGlkZGVuOyB9XG5cbi5zaWRlYmFyLXBhZGRpbmcge1xuICBwYWRkaW5nLXRvcDogMC41NzFlbTtcbiAgcGFkZGluZy1yaWdodDogMWVtO1xuICBwYWRkaW5nLWJvdHRvbTogMC41NzFlbTtcbiAgcGFkZGluZy1sZWZ0OiAxZW07IH1cblxuLnNpZGViYXItZm9vdGVyIHtcbiAgYm9yZGVyLXRvcDogMXB4IHNvbGlkICNjOGM4Yzg7XG4gIGJhY2tncm91bmQ6ICNmNGY0ZjQ7IH1cblxuYm9keSAudWktc2lkZWJhciAudWktc2lkZWJhci1jbG9zZSB7XG4gIHBhZGRpbmctdG9wOiAwLjU3MWVtO1xuICBwYWRkaW5nLXJpZ2h0OiAxZW07XG4gIHBhZGRpbmctYm90dG9tOiAwLjU3MWVtO1xuICBwYWRkaW5nLWxlZnQ6IDFlbTtcbiAgZmxvYXQ6IG5vbmU7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgcmlnaHQ6IDA7XG4gIHRvcDogMDsgfVxuXG5ib2R5IC51aS1zaWRlYmFyIGgxIHtcbiAgbWFyZ2luLWJvdHRvbTogMDtcbiAgbWFyZ2luLXRvcDogLThweDtcbiAgcGFkZGluZy10b3A6IDIzcHg7XG4gIHBhZGRpbmctbGVmdDogMTVweDtcbiAgcGFkZGluZy1ib3R0b206IDAuNjdlbTtcbiAgcGFkZGluZy1yaWdodDogMTAwcHg7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmNGY0ZjQ7XG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjYzhjOGM4OyB9XG5cbkBtZWRpYSAobWluLXdpZHRoOiA3NjhweCkge1xuICBib2R5IC5zaWRlYmFyLWNvbnRhaW5lciAudWktb3JkZXJsaXN0LWNvbnRyb2xzLXJpZ2h0IHtcbiAgICBtYXJnaW4tcmlnaHQ6IC0xNXB4OyB9IH1cblxuLnVpLXN0YXRlLWhpZ2hsaWdodCBhLmljb24tdG9nZ2xlLmRlZmF1bHQtY29sIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzAwNjViMzsgfVxuXG4vKiBOb3RlcyBvbiB6LWluZGV4IChpbiB0aGlzIG9yZGVyKVxuMSA9IExlYWZsZXRcblxuR2Vvd2ViTWFwIExheWVycyAoQ2FudmFzLCBTVkcuLi4pXG5cbjUwMCA9IEdlb3dlYi9DU0lSTyBMb2dvXG5cbjYwMCA9IExlYWZsZXQgTGF5ZXJzIChlZGl0YWJsZSBmZWF0dXJlcyAtIHBvbHlnb25zLi4uKVxuXG42NTAgPSBMZWFmbGV0IHRvb2x0aXAgKHNob3dzIGxheWVyIHZhbHVlcyBvbiBjbGljaylcblxuNzAwID0gTGVhZmxldCBkcmF3IGd1aWRlcyAoZ3JhcGhpY2FsIGVsZW1lbnRzIHNob3duIHdoaWxlIGRyYXdpbmcgc2hhcGVzKVxuXG45MDAgPSBMZWFmbGV0IGNvbnRyb2xzIChidXR0b25zKSArIHpvb20gY29udHJvbGxlclxuXG4xMDAwID0gVGltZSBzbGlkZXJcblxuXG4xMTAwID0gRmlsZSBicm93c2VyIERpYWxvZyAoc28gaXQgaXMgYmVsb3cgZHJvcCB1cGxvYWQuLi4pXG5cbjEyMDAgPSBTcGlubmVyXG5cbjEyNTAgPSBGaWxlIERyb3AgVXBsb2FkIENvbXBvbmVudFxuXG4xMzAwID0gR2Vvd2ViTWFwIGNvbnRyb2xzIChjb25maWcsIHN0YXJ0LCBsb2csIGNvbm5lY3RlZCBzdGF0dXMuLi4pXG5cbjEzNTAgPSBDaGFydCBzaWRlYmFyXG5cbjE0MDAgPSBMb2cgU2lkZWJhciwgTGF5ZXIgU2lkZWJhciwgQ29uZmlnIFNpZGViYXJcblxuMTUwMCA9IERpYWxvZ3NcblxuMTkwMCA9IGZpbGUgdXBsb2FkIHNwaW5uZXJcblxuMjAwMCA9IHRvYXN0IChtZXNzYWdlIHBvcHVwcyBpbiB0b3AgcmlnaHQgY29ybmVyKSBcblxuXG4qL1xuYTpob3ZlciB7XG4gIGNvbG9yOiAjMTE2ZmJmO1xuICBjdXJzb3I6IHBvaW50ZXI7IH1cblxuI21hcC1jb250YWluZXIge1xuICBvdmVyZmxvdzogaGlkZGVuO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7IH1cblxuI21hcCxcbiNtYXAtb3ZlcmxheSxcbi5zdmctb3ZlcmxheSB7XG4gIGhlaWdodDogY2FsYygxMDB2aCk7XG4gIHdpZHRoOiAxMDB2dzsgfVxuXG4uc3ZnLW92ZXJsYXkge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICB6LWluZGV4OiA1MDA7XG4gIHRvcDogMDtcbiAgdHJhbnNmb3JtLW9yaWdpbjogdG9wIGxlZnQ7IH1cblxuI2xheWVyLWxlZ2VuZHMge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHJpZ2h0OiAtMnB4O1xuICBvdmVyZmxvdy15OiBhdXRvO1xuICBvdmVyZmxvdy15OiBvdmVybGF5O1xuICAtbXMtb3ZlcmZsb3ctc3R5bGU6IC1tcy1hdXRvaGlkaW5nLXNjcm9sbGJhcjtcbiAgdG91Y2gtYWN0aW9uOiBub25lO1xuICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgcGFkZGluZzogMnB4OyB9XG5cbiNsYXllci1sZWdlbmRzIC5sZWdlbmQge1xuICBib3gtc2l6aW5nOiBjb250ZW50LWJveDtcbiAgZGlzcGxheTogYmxvY2s7XG4gIGZsb2F0OiByaWdodDtcbiAgY2xlYXI6IGJvdGg7XG4gIHBhZGRpbmc6IDhweDtcbiAgbWFyZ2luLWJvdHRvbTogMTBweDtcbiAgZm9udC1zaXplOiAxNHB4OyB9XG4gICNsYXllci1sZWdlbmRzIC5sZWdlbmQgPiBnIHtcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAxNHB4KTsgfVxuICAjbGF5ZXItbGVnZW5kcyAubGVnZW5kIHRleHQge1xuICAgIGZpbGw6ICMzMzM7IH1cbiAgI2xheWVyLWxlZ2VuZHMgLmxlZ2VuZCAubGVnZW5kVGl0bGUge1xuICAgIGZvbnQtd2VpZ2h0OiBib2xkOyB9XG5cbi5kaXNhYmxlLXBvaW50ZXIge1xuICBwb2ludGVyLWV2ZW50czogbm9uZSAhaW1wb3J0YW50O1xuICB0b3VjaC1hY3Rpb246IG5vbmUgIWltcG9ydGFudDsgfVxuXG4ubGVhZmxldC1jYW52YXMtb3ZlcmxheSxcbi5sZWFmbGV0LXN2Zy1vdmVybGF5IHtcbiAgb3ZlcmZsb3c6IHZpc2libGU7XG4gIHRyYW5zZm9ybS1vcmlnaW46IHRvcCBsZWZ0OyB9XG5cbi5sZWFmbGV0LXRpbGUtcGFuZSxcbi5sZWFmbGV0LW92ZXJsYXktcGFuZSB7XG4gIHotaW5kZXg6IGF1dG87IH1cblxuLmxlYWZsZXQtZHJhdy1ndWlkZXMge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHotaW5kZXg6IDcwMDsgfVxuXG4vKiBPVkVSUklERSBMRUFGTEVUIHpvb20gYW5kIGZhZGUgYW5pbWF0aW9ucyAqL1xuLmxlYWZsZXQtZmFkZS1hbmltIC5sZWFmbGV0LXRpbGUge1xuICB3aWxsLWNoYW5nZTogb3BhY2l0eTsgfVxuXG4ubGVhZmxldC1mYWRlLWFuaW0gLmxlYWZsZXQtcG9wdXAge1xuICBvcGFjaXR5OiAwO1xuICB0cmFuc2l0aW9uOiBvcGFjaXR5IDAuMTVzIGxpbmVhcjsgfVxuXG4ubGVhZmxldC16b29tLWFuaW0gLmxlYWZsZXQtem9vbS1hbmltYXRlZCxcbi5sZWFmbGV0IHtcbiAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDAuMTVzIGN1YmljLWJlemllcigwLCAwLCAwLjI1LCAxKSAhaW1wb3J0YW50OyB9XG5cbi5sZWFmbGV0LXpvb20tYW5pbSAubGVhZmxldC1jYW52YXMtb3ZlcmxheSxcbi5sZWFmbGV0LXpvb20tYW5pbSAubGVhZmxldC1zdmctb3ZlcmxheSB7XG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjE1cyBjdWJpYy1iZXppZXIoMCwgMCwgMC4yNSwgMSk7IH1cblxuLmxlYWZsZXQtZmFkZS1hbmltIC5sZWFmbGV0LW1hcC1wYW5lIC5sZWFmbGV0LXBvcHVwIHtcbiAgb3BhY2l0eTogMTsgfVxuXG4ubGVhZmxldC16b29tLWFuaW1hdGVkIHtcbiAgLXdlYmtpdC10cmFuc2Zvcm0tb3JpZ2luOiAwIDA7XG4gIHRyYW5zZm9ybS1vcmlnaW46IDAgMDsgfVxuXG4ubGVhZmxldC16b29tLWFuaW0gLmxlYWZsZXQtem9vbS1hbmltYXRlZCxcbi5sZWFmbGV0LWNhbnZhcy1vdmVybGF5LFxuLmxlYWZsZXQtc3ZnLW92ZXJsYXkge1xuICB3aWxsLWNoYW5nZTogdHJhbnNmb3JtOyB9XG5cbi5sZWFmbGV0LXpvb20tYW5pbSAubGVhZmxldC10aWxlLFxuLmxlYWZsZXQtcGFuLWFuaW0gLmxlYWZsZXQtdGlsZSB7XG4gIHRyYW5zaXRpb246IG5vbmU7IH1cblxuLmxlYWZsZXQtem9vbS1hbmltIC5sZWFmbGV0LXpvb20taGlkZSB7XG4gIHZpc2liaWxpdHk6IGhpZGRlbjsgfVxuXG4jc3ZnLW92ZXJsYXkuY29udHJvbCxcbi5jb250cm9sIHtcbiAgcG9pbnRlci1ldmVudHM6IGFsbDsgfVxuXG4ubGVhZmxldC10b3Age1xuICB0b3A6IDUwJSAhaW1wb3J0YW50O1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSk7IH1cblxuI3RvcC1yaWdodC1jb250cm9scyB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgcmlnaHQ6IDEwcHg7XG4gIHRvcDogMTBweDtcbiAgei1pbmRleDogOTAwO1xuICB0cmFuc2l0aW9uOiByaWdodCAwLjNzIGN1YmljLWJlemllcigwLjQ1NSwgMC4wMywgMC41MTUsIDAuOTU1KTsgfVxuXG4jYm90dG9tLXJpZ2h0LWNvbnRyb2xzIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICByaWdodDogMTBweDtcbiAgYm90dG9tOiAxMHB4O1xuICB6LWluZGV4OiA5MDA7IH1cblxuI3RvcC1yaWdodC1jb250cm9scy5sYXllci1zaWRlYmFyLXZpc2JsZSwgI2JvdHRvbS1yaWdodC1jb250cm9scy5sYXllci1zaWRlYmFyLXZpc2JsZSwgLmxlZ2VuZC1vdmVybGF5LmxheWVyLXNpZGViYXItdmlzYmxlIHtcbiAgcmlnaHQ6IDMyNXB4OyB9XG5cbiN0b3AtcmlnaHQtY29udHJvbHMgLmZha2UtbGVhZmxldC1jb250cm9sIHtcbiAgcmlnaHQ6IC0xNHB4OyB9XG5cbiN0b3AtcmlnaHQtY29udHJvbHMuaGlkZGVuIHtcbiAgcmlnaHQ6IC02MHB4OyB9XG5cbiN0b3AtbGVmdC1jb250cm9scyxcbiNlZGl0LWZlYXR1cmUtY29udHJvbGxlcixcbiN6b29tLWNvbnRyb2xsZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGxlZnQ6IDEwcHg7XG4gIHRyYW5zaXRpb246IGxlZnQgMC41cyBjdWJpYy1iZXppZXIoMC40NTUsIDAuMDMsIDAuNTE1LCAwLjk1NSk7IH1cblxuI3RvcC1sZWZ0LWNvbnRyb2xzLmhpZGRlbixcbiNlZGl0LWZlYXR1cmUtY29udHJvbGxlci5oaWRkZW4sXG4jem9vbS1jb250cm9sbGVyLmhpZGRlbiB7XG4gIGxlZnQ6IC02MHB4OyB9XG5cbiNlZGl0LWZlYXR1cmUtY29udHJvbGxlciB7XG4gIHotaW5kZXg6IDk5OTtcbiAgYm90dG9tOiAwOyB9XG5cbiNlZGl0LWZlYXR1cmUtY29udHJvbGxlciAubWFwYm94Z2wtY3RybC5tYXBib3hnbC1jdHJsLWdyb3VwIHtcbiAgbWFyZ2luOiAwIDAgMTBweCAwO1xuICBmbG9hdDogbGVmdDsgfVxuXG4jdG9wLWxlZnQtY29udHJvbHMge1xuICB6LWluZGV4OiAxMzAwO1xuICB0b3A6IDEwcHg7IH1cblxuI2VkaXQtZmVhdHVyZS1jb250cm9sbGVyIGE6aG92ZXIsXG4jem9vbS1jb250cm9sbGVyIGE6aG92ZXIsXG4ubGVhZmxldC1jb250cm9sLWxheWVycy10b2dnbGUge1xuICBjdXJzb3I6IHBvaW50ZXI7IH1cblxuLm1hcGJveGdsLWN0cmwtZ3JvdXAgPiBidXR0b24ge1xuICBwb3NpdGlvbjogcmVsYXRpdmU7IH1cblxuLm1hcC1sb2dvIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDZweDtcbiAgbGVmdDogNjFweDtcbiAgei1pbmRleDogNTAwO1xuICBvcGFjaXR5OiAwLjU7XG4gIHRyYW5zaXRpb246IG9wYWNpdHkgY3ViaWMtYmV6aWVyKDAuNDU1LCAwLjAzLCAwLjUxNSwgMC45NTUpIDAuMnM7XG4gIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xuICB0ZXh0LXNoYWRvdzogMCAwIDNweCB3aGl0ZSwgMCAwIDNweCB3aGl0ZSwgMCAwIDNweCB3aGl0ZSwgMCAwIDNweCB3aGl0ZTtcbiAgZm9udC1zaXplOiAyNXB4O1xuICBmb250LXdlaWdodDogNjAwOyB9XG5cbi5tYXAtbG9nbyAubWFwLWxvZ28taW1nIHtcbiAgaGVpZ2h0OiA3N3B4O1xuICBtYXJnaW46IGF1dG87XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBmb250LWZhbWlseTogUm9ib3RvLCBcIkhlbHZldGljYSBOZXVlXCIsIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWYgIWltcG9ydGFudDsgfVxuXG4ubWFwLWxvZ286aG92ZXIge1xuICBvcGFjaXR5OiAwLjc7IH1cblxuI3RpbWVsaW5lLWNvbnRyb2xsZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGJvdHRvbTogMTBweDtcbiAgbGVmdDogNTAlO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XG4gIHdpZHRoOiBjYWxjKDEwMHZ3IC0gNjUwcHgpO1xuICBtaW4td2lkdGg6IDUwMHB4O1xuICBtYXgtd2lkdGg6IDEwMDBweDtcbiAgaGVpZ2h0OiBhdXRvO1xuICBmb250LXNpemU6IDE0cHg7XG4gIHotaW5kZXg6IDEwMDA7XG4gIHRyYW5zaXRpb246IGJvdHRvbSAwLjNzIGN1YmljLWJlemllcigwLjQ1NSwgMC4wMywgMC41MTUsIDAuOTU1KTsgfVxuXG4udGltZWxpbmUge1xuICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IG1pbi1jb250ZW50IGF1dG8gMTY0cHg7XG4gIGRpc3BsYXk6IGdyaWQ7XG4gIHBhZGRpbmc6IDVweDsgfVxuXG4udGltZWxpbmUuaGlkZGVuIHtcbiAgYm90dG9tOiAtMTAwcHg7IH1cblxuLnRpbWVsaW5lIC51aS1jYWxlbmRhci13LWJ0biBpbnB1dC51aS1pbnB1dHRleHQge1xuICB3aWR0aDogY2FsYygxMDAlIC0gMzNweCk7IH1cblxuLnRpbWUtc2xpZGVyLWxhYmVsIHtcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgZGlzcGxheTogZmxleDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgbWFyZ2luOiAwIDVweDsgfVxuXG4udGltZS1zbGlkZXIge1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCA1MCUpO1xuICBwYWRkaW5nOiAwIDE0cHg7XG4gIHRvcDogLTFweDtcbiAgcG9zaXRpb246IHJlbGF0aXZlOyB9XG5cbi50aW1lLWlucHV0IHtcbiAgd2lkdGg6IDEzMHB4OyB9XG5cbi5sZWFmbGV0LXRvb2xiYXItMCB7XG4gIHdpZHRoOiAzNHB4O1xuICBtYXJnaW4tYm90dG9tOiAxMHB4OyB9XG5cbi5sZWFmbGV0LWNvbnRyb2wtdG9vbGJhciA+IGxpOmZpcnN0LWNoaWxkID4gLmxlYWZsZXQtdG9vbGJhci1pY29uIHtcbiAgYm9yZGVyLXRvcC1sZWZ0LXJhZGl1czogMnB4O1xuICBib3JkZXItdG9wLXJpZ2h0LXJhZGl1czogMnB4OyB9XG5cbi5sZWFmbGV0LWNvbnRyb2wtdG9vbGJhciA+IGxpOmxhc3QtY2hpbGQgPiAubGVhZmxldC10b29sYmFyLWljb24ge1xuICBib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzOiAycHg7XG4gIGJvcmRlci1ib3R0b20tcmlnaHQtcmFkaXVzOiAycHg7IH1cblxuLmxlYWZsZXQtdG9vbGJhci1pY29uLWN1c3RvbSB7XG4gIHRleHQtZGVjb3JhdGlvbjogbm9uZSAhaW1wb3J0YW50O1xuICBjb2xvcjogIzMzMyAhaW1wb3J0YW50OyB9XG5cbi5sZWFmbGV0LXRvb2xiYXItaWNvbi1jdXN0b206aG92ZXIge1xuICBjb2xvcjogIzIyMiAhaW1wb3J0YW50O1xuICBjdXJzb3I6IHBvaW50ZXI7IH1cblxuLmljb24tdG9nZ2xlIHtcbiAgaGVpZ2h0OiAxMDAlO1xuICB3aWR0aDogMzBweDtcbiAgZGlzcGxheTogYmxvY2s7XG4gIGZsb2F0OiByaWdodDtcbiAgbWFyZ2luOiAtMXB4IDA7XG4gIGZvbnQtc2l6ZTogMTZweDtcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xuICBib3JkZXItcmFkaXVzOiAxMnB4OyB9XG5cbi5pY29uLXRvZ2dsZTpob3ZlciB7XG4gIGN1cnNvcjogcG9pbnRlcjsgfVxuXG4udWktc3RhdGUtaGlnaGxpZ2h0IC5pY29uLXRvZ2dsZS5kZWZhdWx0LWNvbCB7XG4gIGNvbG9yOiAjZmZmOyB9XG5cbi51aS1zdGF0ZS1oaWdobGlnaHQgLmljb24tdG9nZ2xlLmRlZmF1bHQtY29sOmhvdmVyIHtcbiAgY29sb3I6ICNmZmZmZmZjYzsgfVxuXG4udWktb3JkZXJsaXN0LWl0ZW06bm90KC51aS1zdGF0ZS1oaWdobGlnaHQpOmhvdmVyIGEuaWNvbi10b2dnbGUuc2Vjb25kYXJ5LWNvbCB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNkMmNmY2Y7IH1cblxuLnVpLW9yZGVybGlzdC1pdGVtOm5vdCgudWktc3RhdGUtaGlnaGxpZ2h0KTpob3ZlciBhLmljb24tdG9nZ2xlLnNlY29uZGFyeS1jb2w6aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjYzNjM2MzOyB9XG5cbi5kcmF3LWZpcmUtaWNvbiB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgdG9wOiAzcHg7XG4gIGxlZnQ6IDdweDsgfVxuXG4uc2Vjb25kYXJ5LWRyYXctZmlyZS1pY29uIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBjb2xvcjogI2FhYTtcbiAgdG9wOiA4cHg7XG4gIHJpZ2h0OiA2cHg7XG4gIGZvbnQtc2l6ZTogMTVweDtcbiAgZmlsdGVyOiBkcm9wLXNoYWRvdygtMXB4IC0xcHggMHB4ICNmZmYpOyB9XG5cbi5sYXllci1zaWRlYmFyLWNvbnRhaW5lciAudWktd2lkZ2V0LWNvbnRlbnQudWktb3JkZXJsaXN0LWxpc3Qge1xuICBtaW4taGVpZ2h0OiAyMDBweDtcbiAgaGVpZ2h0OiBhdXRvOyB9XG5cbi5sYXllci12YWx1ZXMtcG9wdXAgLm1hcGJveGdsLXBvcHVwLWNvbnRlbnQge1xuICBwb2ludGVyLWV2ZW50czogbm9uZTsgfVxuXG4ubGF5ZXItdmFsdWVzLXBvcHVwIC5sZWFmbGV0LXBvcHVwLWNvbnRlbnQtd3JhcHBlcixcbi5sYXllci12YWx1ZXMtcG9wdXAgLmxlYWZsZXQtcG9wdXAtdGlwIHtcbiAgYm94LXNoYWRvdzogbm9uZTsgfVxuXG4ubGVhZmxldC1wb3B1cC10aXAge1xuICBib3R0b206IC0xOHB4O1xuICBib3JkZXI6IG5vbmUgIWltcG9ydGFudDtcbiAgYm9yZGVyLXJhZGl1czogMDtcbiAgLXdlYmtpdC1maWx0ZXI6IGRyb3Atc2hhZG93KDBweCAtMnB4IDBweCByZ2JhKDAsIDAsIDAsIDAuMikpO1xuICBmaWx0ZXI6IGRyb3Atc2hhZG93KDJweCAycHggMHB4IHJnYmEoMCwgMCwgMCwgMC4yKSk7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lOyB9XG5cbi5sZWFmbGV0LXBvcHVwLXRpcC1jb250YWluZXIge1xuICBib3R0b206IC0xOHB4OyB9XG5cbi5sYXllci12YWx1ZXMtcG9wdXAgLmxlYWZsZXQtcG9wdXAtY29udGVudC13cmFwcGVyIHtcbiAgYm9yZGVyLXJhZGl1czogM3B4OyB9XG5cbi5sYXllci12YWx1ZXMtcG9wdXAgLmxlYWZsZXQtcG9wdXAtY29udGVudCB7XG4gIG1hcmdpbjogMDtcbiAgcGFkZGluZzogMTJweDsgfVxuXG4ubGF5ZXItdmFsdWVzLXBvcHVwIHA6bm90KDpsYXN0LWNoaWxkKSB7XG4gIG1hcmdpbjogMCAwIDRweCAwOyB9XG5cbi5sYXllci12YWx1ZXMtcG9wdXAgcDpsYXN0LWNoaWxkIHtcbiAgbWFyZ2luOiAwOyB9XG5cbiNjaGFydC1jb250YWluZXIge1xuICBwYWRkaW5nOiAwIDEwcHggMTBweCAxMHB4OyB9XG5cbiNjaGFydCB7XG4gIGhlaWdodDogMjUwcHg7IH1cblxuYm9keSAudWktc2lkZWJhci5jaGFydC1zaWRlYmFyIHtcbiAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjkpO1xuICB6LWluZGV4OiAxMzUwICFpbXBvcnRhbnQ7XG4gIG1hcmdpbjogMDtcbiAgbWFyZ2luLWJvdHRvbTogLTRweDtcbiAgei1pbmRleDogMTAxMTtcbiAgd2lkdGg6IGNhbGMoMTAwdncgLSA2NTBweCk7XG4gIG1pbi13aWR0aDogNTAwcHg7XG4gIG1heC13aWR0aDogMTAwMHB4O1xuICBvcGFjaXR5OiAxO1xuICBsZWZ0OiA1MCU7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIDEwMCUpO1xuICBib3JkZXItcmFkaXVzOiA0cHg7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDJweCByZ2JhKDAsIDAsIDAsIDAuMSk7XG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjNzIGN1YmljLWJlemllcigwLjQ1NSwgMC4wMywgMC41MTUsIDAuOTU1KTsgfVxuXG5ib2R5IC51aS1zaWRlYmFyLmNoYXJ0LXNpZGViYXIudWktc2lkZWJhci1hY3RpdmUge1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLCAwKTsgfVxuXG5ib2R5IC51aS1zaWRlYmFyLmNoYXJ0LXNpZGViYXIgaDMge1xuICBtYXJnaW46IDA7XG4gIHBhZGRpbmctdG9wOiAxMHB4O1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIGJvcmRlci10b3AtbGVmdC1yYWRpdXM6IDRweDtcbiAgYm9yZGVyLXRvcC1yaWdodC1yYWRpdXM6IDRweDsgfVxuXG4ubWFwYm94Z2wtY3RybC1ib3R0b20tbGVmdCB7XG4gIHRvcDogNTAlO1xuICBib3R0b206IHVuc2V0O1xuICBsZWZ0OiAwO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAtNTAlKTsgfVxuXG4jc2ltdWxhdGlvbi1wbGF5IHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBib3R0b206IDEwcHg7XG4gIGxlZnQ6IDUwJSAhaW1wb3J0YW50O1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XG4gIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgei1pbmRleDogMTMwMDtcbiAgcGFkZGluZzogNXB4IDEwcHg7XG4gIGJhY2tncm91bmQtY2xpcDogcGFkZGluZy1ib3g7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgb3BhY2l0eTogNzAlOyB9XG5cbiNzaW11bGF0aW9uLXNwZWVkIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBib3R0b206IDVweDtcbiAgbGVmdDogNTAlICFpbXBvcnRhbnQ7XG4gIHotaW5kZXg6IDE0MDA7IH1cblxuLmxlZ2VuZC1vdmVybGF5IHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB3aWR0aDogNiU7XG4gIGJvdHRvbTogMTAwcHg7XG4gIGxlZnQ6IDA7XG4gIGhlaWdodDogYXV0bztcbiAgb3ZlcmZsb3c6IHZpc2libGU7XG4gIHBhZGRpbmc6IDAgMCAwIDA7XG4gIG1hcmdpbjogMCAwIDAgMDtcbiAgei1pbmRleDogMTAwOyB9XG5cbi5sZWdlbmQtb3ZlcmxheSAubGVnZW5kLW92ZXJsYXktaW5uZXIge1xuICBjb2xvcjogcmdiYSgxNywgMTcsIDE3LCAwLjgpO1xuICBwYWRkaW5nOiAwO1xuICBvdmVyZmxvdzogdmlzaWJsZTsgfVxuXG4ubGVnZW5kLW92ZXJsYXktaW5uZXIgdGFibGUgdGQge1xuICB0ZXh0LXRyYW5zZm9ybTogY2FwaXRhbGl6ZTsgfVxuXG4ubGluZV9icmVhayB7XG4gIHBhZGRpbmc6IDAuNXB4O1xuICBib3JkZXI6IG5vbmU7XG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCBncmF5OyB9XG4iXX0= */"

/***/ }),

/***/ "./src/app/geo-web/map/map.component.ts":
/*!**********************************************!*\
  !*** ./src/app/geo-web/map/map.component.ts ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const MapboxDraw = __webpack_require__(/*! @mapbox/mapbox-gl-draw */ "./node_modules/@mapbox/mapbox-gl-draw/index.js");
const d3_1 = __webpack_require__(/*! d3 */ "./node_modules/d3/index.js");
const job_service_service_1 = __webpack_require__(/*! ../../services/job-service.service */ "./src/app/services/job-service.service.ts");
const map_popup_service_1 = __webpack_require__(/*! ./map-popup/map-popup.service */ "./src/app/geo-web/map/map-popup/map-popup.service.ts");
const map_editable_feature_layer_1 = __webpack_require__(/*! ./map-layer/map-editable-feature-layer */ "./src/app/geo-web/map/map-layer/map-editable-feature-layer.ts");
const message_api_1 = __webpack_require__(/*! ../../../../../shared/src/message-api */ "../shared/src/message-api/index.ts");
const flash_message_service_1 = __webpack_require__(/*! ../../services/flash-message.service */ "./src/app/services/flash-message.service.ts");
const rest_api_service_1 = __webpack_require__(/*! src/app/services/rest-api.service */ "./src/app/services/rest-api.service.ts");
const spinner_service_service_1 = __webpack_require__(/*! src/app/spinner/spinner-service.service */ "./src/app/spinner/spinner-service.service.ts");
const job_base_1 = __webpack_require__(/*! ../../../../../shared/src/job/job-base */ "../shared/src/job/job-base.ts");
const array_1 = __webpack_require__(/*! ../../../../../shared/src/util/array */ "../shared/src/util/array.ts");
const time_slider_1 = __webpack_require__(/*! ./map-layer/time-slider */ "./src/app/geo-web/map/map-layer/time-slider.ts");
const string_1 = __webpack_require__(/*! ../../../../../shared/src/util/string */ "../shared/src/util/string.ts");
const layer_service_service_1 = __webpack_require__(/*! ./map-layer/layer-service.service */ "./src/app/geo-web/map/map-layer/layer-service.service.ts");
const turf_1 = __webpack_require__(/*! @turf/turf */ "./node_modules/@turf/turf/turf.min.js");
const mapboxGl = __webpack_require__(/*! mapbox-gl */ "./node_modules/mapbox-gl/dist/mapbox-gl.js");
const mapbox_gl_layer_1 = __webpack_require__(/*! ./map-layer/mapbox-gl-layer */ "./src/app/geo-web/map/map-layer/mapbox-gl-layer.ts");
const mapbox_draw_styles_1 = __webpack_require__(/*! ./mapbox-draw-styles */ "./src/app/geo-web/map/mapbox-draw-styles.ts");
/**
 * This component wraps up Mapbox GL and all map related functionality: map layers, charts...
 *
 * @export
 * @class GeowebMapComponent
 */
let GeowebMapComponent = class GeowebMapComponent {
    constructor(jobService, restApiService, layerService, mapPopupService, zone, spinnerService, cdr, flashMessageService) {
        this.jobService = jobService;
        this.restApiService = restApiService;
        this.layerService = layerService;
        this.mapPopupService = mapPopupService;
        this.zone = zone;
        this.spinnerService = spinnerService;
        this.cdr = cdr;
        this.flashMessageService = flashMessageService;
        this.showLayerValues = false;
        this.showLayerController = false;
        this.showChartController = false;
        this.showLayerMetadataPopup = false;
        this.jobLayers = [];
        this.jobInputLayers = [];
        this.jobOutputLayers = [];
        this.selectedLayers = [];
        this.editableFeatureToolbarButtons = [];
        this.timeSliders = [];
        this.mapStyle = "mapbox://styles/mapbox/light-v10";
        this.mapStyleChanged = false;
        this.isPlaying = false;
        this.simulationStatus = "Play";
        this.clockStartTime = -1;
        this.timeFromSlider = "00:00";
        this.timeSliderStep = 0;
        this.customFormValidators = {
            floatValidator: string_1.floatValidator,
        };
        this.configForEES = { region: "", population: "any", fire: "any", evacMessage: "NONE", speed: "60", time: "00:00", crs: "", finalMessageList: {} };
        this.activities = {};
        // Emergency messages
        this.emergencyMessageDialog = false;
        this.zoneVisibility = false;
        this.messageList = false;
        this.messageListDialog = false;
        this.updateMessage = false;
        this.shiftPressed = false;
        this.shiftReleased = false;
        this.shiftSelectedZones = [];
        this.multiplePressed = false;
        this.isZoneCleared = false;
        this.evacMessages = {
            options: [
                {
                    message: "NONE"
                },
                {
                    message: "ADVICE",
                },
                {
                    message: "WATCH&ACT",
                },
                {
                    message: "EMERGENCY_WARNING",
                },
                {
                    message: "EVACUATE_NOW",
                },
            ]
        };
        this.mapStyles = {
            options: [
                {
                    style: "outdoors-v11"
                },
                {
                    style: "dark-v10"
                },
                {
                    style: "light-v10"
                },
                {
                    style: "streets-v11"
                },
                {
                    style: "satellite-v9"
                },
            ]
        };
        this.enteredEvacMessages = [];
        this.messageListOptions = [];
        this.highlightedZones = [];
        this.Errors = { "messageType": false, "time": false, "content": false, "duplicate": false };
        this.finalMessageList = {
            "help": [
                "List of emergency messages to inject into the simulation",
                "{",
                "type: one of ADVICE, WATCH_AND_ACT, EVACUATE_NOW",
                "broadcastHHMM : the time in HHMM format when this mesage is to be sent",
                "broadcastZones: list of zones IDs to which this message should be sent",
                "}"
            ],
            "spatialReferenceEPSG": "EPSG:28355",
            "messages": []
        };
        this.regionData = {
            "mount_alexander_shire": {
                center: [144.212304, -37.064737],
                crs: "EPSG:28355"
            },
            "surf_coast_shire": {
                center: [144.326271, -38.332386],
                crs: "EPSG:32754"
            },
            "yarra_ranges_shire": {
                center: [145.7530, -37.8650],
                crs: "EPSG:32755"
            }
        };
        this.chartSubscription = this.layerService.chartBehaviourObservable.subscribe(message => {
            if (typeof message === "undefined") {
                this.currentChart = undefined;
                this.showChartController = false;
            }
            else {
                this.currentChart = message.chart;
                this.showChartController = !message.hide;
            }
        });
        this.jobSubscription = this.jobService
            .getCurrentJobObservable()
            .subscribe(job => {
            if (typeof job !== "undefined") {
                this.onJobUpdated(job);
                this.jobType = job.type;
                this.jobName = job.name;
                console.log("job loaded");
            }
        });
    }
    /**
     * Handle escape key presses
     *
     * @param event
     */
    handleKeyboardEvent(event) {
        if (event.key === "Escape") {
            if (this.showLayerMetadataPopup) {
                this.showLayerMetadataPopup = false;
                event.stopImmediatePropagation();
            }
            else if (typeof this.mapPopupService.currentPopup !== "undefined" &&
                this.mapPopupService.currentPopup !== null) {
                this.mapPopupService.hidePopup();
                event.stopImmediatePropagation();
            }
            else if (this.showLayerController) {
                this.showLayerController = false;
                event.stopImmediatePropagation();
            }
            else if (this.showChartController) {
                this.showChartController = false;
                event.stopImmediatePropagation();
            }
            else if (this.showLayerValues) {
                this.showLayerValues = false;
                event.stopImmediatePropagation();
            }
        }
    }
    ngOnInit() {
    }
    getConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            this.configForEES.finalMessageList = {};
            yield this.createFinalMessagesList();
            this.configForEES.finalMessageList = this.finalMessageList;
            return this.configForEES;
        });
    }
    clearPopLegends() {
        this.activities = {};
    }
    stopCurrentSimulation() {
        if (this.isPlaying) {
            console.log("stop job");
            this.isPlaying = false;
            this.simulationStatus = "Play";
            this.currentJob.setupStop();
            this.currentJob.stopAnimation();
            this.setupRunClock();
            this.stopClock();
        }
    }
    /**
    * Revert back to start when new job loaded
    */
    changeClockStart() {
        this.clockStartTime = -1;
        console.log("this.clockStartTime" + this.clockStartTime);
        return true;
    }
    /**
     * DSS : EVENT handler for play button at the bottom
     */
    playSimulation() {
        console.log("play simulation" + this.currentJob.getAnimationSpeed());
        console.log(this.currentJob.mapboxStyle);
        if (this.isPlaying) {
            this.isPlaying = false;
            this.simulationStatus = "Play";
            this.currentJob.setupStop();
            this.currentJob.stopAnimation();
            this.setupRunClock();
            this.stopClock();
        }
        else {
            this.isPlaying = true;
            this.simulationStatus = "Pause";
            this.currentJob.setupStop();
            this.currentJob.animateMaldonTest();
            this.setupRunClock();
            this.startClock();
        }
        // if(this.currentJob.animateMaldonTest())
    }
    /**
     * Start the clock when play button clicked
     */
    startClock() {
        this.intervalValue = setInterval(() => {
            if (this.clockStartTime == -1) //change this condition to true in first iteration
             {
                console.log("first round");
                this.clockStartTime = Date.now();
            }
            let start = this.currentJob.getTimeStamps().start;
            let finish = this.currentJob.getTimeStamps().finish;
            const loopLength = finish - start;
            let animationSpeed = this.animationSpeed;
            var timestamp;
            var loopTime;
            let totalSeconds;
            timestamp = (Date.now() - this.clockStartTime) / 1000;
            loopTime = loopLength / animationSpeed;
            let time1 = new Date().getTime();
            totalSeconds = Math.round(((timestamp % loopTime) / loopTime) * loopLength + start);
            let hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            let minutes = Math.floor(totalSeconds / 60);
            let seconds = totalSeconds % 60;
            let minutesSTR = String(minutes).padStart(2, "0");
            let hoursSTR = String(hours).padStart(2, "0");
            let secondsSTR = String(seconds).padStart(2, "0");
            if (this.runClock) {
                this.clock = hoursSTR + ":" + minutesSTR + ":" + secondsSTR;
            }
        }, 1000);
    }
    /**
     * Setup initial time on the clock
     */
    setupInitialTime() {
        let totalSeconds = this.currentJob.getTimeStamps().start;
        console.log("time start" + totalSeconds);
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;
        let minutesSTR = String(minutes).padStart(2, "0");
        let hoursSTR = String(hours).padStart(2, "0");
        let secondsSTR = String(seconds).padStart(2, "0");
        this.clock = hoursSTR + ":" + minutesSTR + ":" + secondsSTR;
        let totalMinutes = minutes + (hours * 60);
        //console.log("total" + totalMinutes)
        this.currentJob.simulateFireLayer(totalMinutes);
        console.log("setup clock" + this.clock);
    }
    /**
     * Save the current simulataion time when clock stops
     */
    stopClock() {
        clearInterval(this.intervalValue);
        let currentTime = this.clock;
        this.clock = currentTime;
        console.log("currentTime" + currentTime);
    }
    /**
     * handle stop and start state of the clock
     */
    setupRunClock() {
        if (this.runClock) {
            this.runClock = false;
        }
        else {
            this.runClock = true;
        }
    }
    ngAfterViewInit() {
        this.initMapbox();
        this.layerService.layerLegendElement = d3_1.select("#layer-legends");
    }
    ngOnDestroy() {
        this.chartSubscription.unsubscribe();
        this.jobSubscription.unsubscribe();
        this.cdr.detach();
    }
    initMapbox() {
        this.zone.runOutsideAngular(() => {
            this.spinnerService.setSpinner(`mapbox-init`, {
                name: `Initialising Mapbox`,
                icon: spinner_service_service_1.SpinnerIcon.Square,
            });
            mapboxGl.accessToken =
                "pk.eyJ1Ijoibmlja2ZvcmJlc3NtaXRoIiwiYSI6ImNrMHl2eXF4ejA4aGozYmp4YmlkOTBnbjEifQ.qGNT0EV6MmPtyQa4ifGzYA";
            const map = new mapboxGl.Map({
                container: "map",
                style: this.mapStyle,
                zoom: 4,
                logoPosition: "bottom-right",
                center: [133.46191406250003, -26.23430203240673],
            });
            map.once("load", () => {
                this.spinnerService.removeSpinner(`mapbox-init`);
            });
            map.on("load", () => {
                map.on('mousemove', 'zone-hover', (e) => {
                    // console.log("mousemove")
                    if (e.features.length > 0) {
                        //console.log("mousemove1")
                        if (hoveredStateId) {
                            console.log("mousemove hover false");
                            map.setFeatureState({ source: 'zonehover', id: hoveredStateId }, { hover: false });
                        }
                        //this.layerService.mapboxGl
                        //console.log("mousemove3")
                        //console.log(e.features[0])
                        //console.log(e.features[0].id)
                        hoveredStateId = e.features[0].id;
                        console.log(hoveredStateId);
                        map.setFeatureState({ source: 'zonehover', id: hoveredStateId }, { hover: true });
                    }
                });
                // When the mouse leaves the state-fill layer, update the feature state of the
                // previously hovered feature.
                map.on('mouseleave', 'zone-hover', () => {
                    // console.log("mouseleave")
                    if (hoveredStateId) {
                        map.setFeatureState({ source: 'zonehover', id: hoveredStateId }, { hover: false });
                    }
                    hoveredStateId = null;
                });
            });
            const nav = new mapboxGl.NavigationControl({
                visualizePitch: true,
            });
            map.addControl(nav, "bottom-left");
            const geolocate = new mapboxGl.GeolocateControl();
            map.addControl(geolocate, "bottom-left");
            // const scaleControl = new mapboxGl.ScaleControl()
            // map.addControl(scaleControl, "bottom-right")
            map.on("error", event => {
                if (event.error.message !== "Unauthorized") {
                    console.error(event);
                }
            });
            map.on("click", event => {
                // fire onClick for all layers where onClickPolicy === 'all'
                ;
                [...this.jobLayers, ...this.jobInputLayers].forEach(l => {
                    // Fire onClick if not currently editing a editableFeatureColLayer AND:
                    // - onClickPolicy is 'all'
                    // - OR onClickPolicy is 'selected' and layer is selected
                    // OR EditableFeatureCollectionLayer.mode === 'edit' && l is editableFeatureColLayer (TODO: this should not be here...)
                    if ((!map_editable_feature_layer_1.EditableFeatureCollectionLayer.editInProgress &&
                        typeof l.onClick !== "undefined" &&
                        (l.onClickPolicy === "all" ||
                            (l.onClickPolicy === "selected" &&
                                this.selectedLayers.findIndex(s => s.name === l.name) !==
                                    -1))) ||
                        (map_editable_feature_layer_1.EditableFeatureCollectionLayer.mode === "edit" &&
                            l.type === "EditableFeatureCollectionLayer")) {
                        // l.onClick can be three things: undefined, function or EditableFeatureCollectionLayer
                        const point = {
                            layerPoint: event.point,
                            latlng: event.lngLat,
                        };
                        if (typeof l.onClick === "function") {
                            l.onClick(point);
                            return;
                        }
                        // Else l.onClick is a EditableFeatureCollectionLayer
                        const features = l.getFeaturesAtPoint(point);
                        if (Array.isArray(features) && features.length > 0) {
                            const feature = turf_1.clone(features[0]);
                            feature.properties = {};
                            l.onClick.addFeatures([feature]);
                        }
                    }
                });
                //Remove highlighted zones
                this.highlightedZones.forEach(function (value) {
                    map.setPaintProperty(value, 'fill-color', 'rgba(200, 100, 240, 0.5)');
                });
                this.highlightedZones = [];
            });
            // Hide popups on map {move, zoom}
            map.on("movestart", () => {
                this.zone.run(() => {
                    if (typeof this.mapPopupService.currentPopup !== "undefined" &&
                        this.mapPopupService.currentPopup.closeOnMapMove) {
                        this.mapPopupService.hidePopup();
                    }
                });
            });
            //Handle click event of population sub groups
            map.on('click', 'subgroups-layer', (e) => {
                //console.log(e.features[0])
                console.log(e.features[0].properties.SA1_MAIN16);
                // this.emergencyMessageDialog = true
                //console.log(this.emergencyMessageDialog)
                if (!this.shiftPressed) {
                    this.shiftSelectedZones = [];
                    this.showEmergencyMessageDialog();
                    this.broadcastZoneString = "Broadcast Zone " + e.features[0].properties.SA1_MAIN16;
                }
                if (this.shiftPressed) {
                    this.createLayersWithShift(e.features[0]);
                }
                this.selectedZone = e.features[0];
                this.broadcastZones = e.features[0].properties.SA1_MAIN16;
                // this.mapPopupService.showPopup("here")
                // this.showPop()
            });
            var zonePopup = new mapboxGl.Popup({
                closeButton: false,
                closeOnClick: false
            });
            map.on('mousemove', 'subgroups-layer', function (e) {
                // Change the cursor style as a UI indicator.
                //map.getCanvas().style.cursor = 'pointer';
                var coordinates = e.features[0].geometry["coordinates"][0][0];
                var description = "Zone : " + e.features[0].properties.SA1_MAIN16 + "<br>" + e.features[0].properties.SA3_NAME16;
                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }
                // Populate the popup and set its coordinates
                // based on the feature found.
                zonePopup
                    .setLngLat(coordinates)
                    .setHTML(description)
                    .addTo(map);
            });
            map.on('mouseleave', 'subgroups-layer', function () {
                map.getCanvas().style.cursor = '';
                zonePopup.remove();
            });
            // Handle hover feature on zones.
            var hoveredStateId = null;
            map.on("zoomstart", () => {
                this.zone.run(() => {
                    if (typeof this.mapPopupService.currentPopup !== "undefined" &&
                        this.mapPopupService.currentPopup.closeOnMapMove) {
                        this.mapPopupService.hidePopup();
                    }
                });
            });
            // Handle layer values popup - this is activated using the crosshairs button in the top right
            let popupVisible = false;
            const popup = new mapboxGl.Popup({
                className: "layer-values-popup",
                closeButton: false,
                closeOnClick: false,
            });
            popup.on("close", (() => {
                popupVisible = false;
                this.showLayerValues = false;
            }).bind(this));
            map.on("mousemove", event => {
                // let fs = map.queryRenderedFeatures(event.point, { layers: ['myiconlayer']});
                if (this.showLayerValues) {
                    const point = {
                        layerPoint: event.point,
                        latlng: event.lngLat,
                    };
                    const values = [];
                    values.push({
                        value: `${d3_1.format(".5f")(point.latlng.lng)}° ${d3_1.format(".5f")(point.latlng.lat)}°`,
                        name: "Long/Lat",
                        units: "",
                    });
                    [...this.jobLayers, ...this.jobInputLayers]
                        .filter(l => l.showValueInPopup)
                        .forEach(l => {
                        const value = l.getValueAtPoint(point);
                        if (typeof value !== "undefined") {
                            values.push({ value, name: l.name, units: l.units });
                        }
                    });
                    if (values.length > 0) {
                        popup
                            .setLngLat(point.latlng)
                            .setHTML(values.reduce((accum, current) => `${accum}<p><b>${current.name}</b><br/>${current.value} ${typeof current.units !== "undefined" ? current.units : ""}</p>`, ""));
                        if (!popupVisible) {
                            popupVisible = true;
                            this.showLayerValues = true;
                            popup.addTo(map);
                        }
                        // If no values and popup is visible -> close popup
                    }
                    else if (popupVisible) {
                        popupVisible = false;
                        popup.remove();
                    }
                }
                else if (popupVisible) {
                    popupVisible = false;
                    this.showLayerValues = false;
                    popup.remove();
                }
            });
            map.on("style.load", event => {
                console.log("style changed");
                if (this.mapStyleChanged) {
                    this.currentJob.createInputLayers();
                    this.currentJob.setMapStyle(this.mapStyle);
                }
            });
            this.layerService.mapboxGl = map;
            //Hover filter start
            //Hover filter end
            // this.layerService.mapboxDraw = new MapboxDraw({
            //   displayControlsDefault: false,
            //   controls: {
            //     polygon: true,
            //     trash: true
            //   },
            //   styles: mapboxDrawStyles,
            // })
            let draw = new MapboxDraw({
                displayControlsDefault: false,
                styles: mapbox_draw_styles_1.mapboxDrawStyles,
            });
            map.addControl(draw, 'bottom-right');
            map.on('draw.create', mapDrawHandle);
            function mapDrawHandle(e) {
                let data = draw.getAll();
                console.log("draw");
                console.log(data);
                console.log(data.features[0].properties);
            }
        });
    }
    isString(s) {
        return typeof s === "string";
    }
    isFunction(f) {
        return typeof f === "function";
    }
    onJobUpdated(job) {
        return __awaiter(this, void 0, void 0, function* () {
            const init = typeof this.currentJob === "undefined" ||
                this.currentJob.name !== job.name ||
                this.currentJob.type !== job.type;
            const statusChanged = typeof this.currentJobStatus !== "undefined" &&
                job.status !== this.currentJobStatus;
            const jobChanged = typeof this.currentJob !== "undefined" && job.name !== job.name;
            this.currentJob = job;
            this.currentJobStatus = job.status;
            if (init ||
                (statusChanged &&
                    this.currentJobStatus !== job_base_1.JobStatus.RUNNING &&
                    this.currentJobStatus !== job_base_1.JobStatus.QUEUED &&
                    this.currentJobStatus !== job_base_1.JobStatus.STARTING)) {
                try {
                    this.spinnerService.setSpinner(`current-job-init`, {
                        name: `Initialising job view`,
                        icon: spinner_service_service_1.SpinnerIcon.LineSpin,
                    });
                    if (this.layerService.mapboxGl.getStyle().sprite !==
                        this.currentJob.mapboxStyle) {
                        this.layerService.mapboxGl.setStyle(this.currentJob.mapboxStyle);
                        // The style must be loaded before adding layers - or the new layers about to be added might be removed
                        yield new Promise(resolve => this.layerService.mapboxGl.once("styledata", resolve));
                    }
                    this.layerService.clearFileCache();
                    this.selectedLayers = [];
                    this.jobLayers = [];
                    this.timeSliders = [];
                    // Update input layers
                    // if job status Changes -> then just update input layers
                    if (!init && statusChanged) {
                        yield this.currentJob.updateInputLayers();
                        yield Promise.all(this.jobInputLayers.map((layer) => __awaiter(this, void 0, void 0, function* () {
                            yield layer.updateLayer(true);
                        })));
                        // Else remove input layers and create them again
                    }
                    else {
                        this.layerService.removeChart();
                        yield Promise.all(this.jobInputLayers.map(layer => layer.delete()));
                        this.jobInputLayers = yield this.currentJob.createInputLayers();
                        // Get edit feature toolbar buttons from EditableFeatureCollectionLayers
                        this.editableFeatureToolbarButtons = array_1.flattenArray(this.jobInputLayers
                            .filter(map_editable_feature_layer_1.EditableFeatureCollectionLayer.isInstanceOf)
                            .map(layer => layer.getToolbarButtons()));
                    }
                    this.jobLayers.push(...this.jobInputLayers);
                    // Delete all output layers
                    this.jobOutputLayers.forEach(layer => {
                        layer.delete();
                    });
                    // If job is finished -> draw results
                    if (this.currentJob.status === job_base_1.JobStatus.FINISHED) {
                        console.log("here finished");
                        this.spinnerService.setSpinner(`current-job-init`, {
                            name: `Creating output layers`,
                            icon: spinner_service_service_1.SpinnerIcon.GridPulse,
                        });
                        this.activities = {};
                        // this.currentJob.setMapStyle(this.mapStyle)
                        console.log(this.mapStyle);
                        //await this.layerService.mapboxGl.setStyle(this.mapStyle)
                        this.jobOutputLayers = yield this.currentJob.createSimulationLayer();
                        this.setupInitialTime();
                        this.animationSpeed = this.currentJob.getAnimationSpeed();
                        this.jobLayers.push(...this.jobOutputLayers);
                    }
                    this.currentJob.setBbox();
                    if (init || jobChanged) {
                        this.zoomToJobBbox();
                    }
                    this.updateTimeSliders();
                    this.setLayerZOrder();
                }
                catch (error) {
                }
                finally {
                    this.spinnerService.removeSpinner(`current-job-init`);
                }
            }
        });
    }
    downloadUrl(url, type) {
        return __awaiter(this, void 0, void 0, function* () {
            this.spinnerService.setSpinner(`download-file-${url}`, {
                name: `Downloading ${url}`,
                icon: spinner_service_service_1.SpinnerIcon.LineSpin,
                progress: 0,
            });
            yield this.restApiService.downloadUrl(url, type, progress => {
                this.spinnerService.setSpinner(`download-file-${url}`, {
                    name: `Downloading ${url}`,
                    icon: spinner_service_service_1.SpinnerIcon.LineSpin,
                    progress,
                });
            });
            this.spinnerService.removeSpinner(`download-file-${url}`);
        });
    }
    toggleLayerOpacity(evt, layer) {
        return __awaiter(this, void 0, void 0, function* () {
            evt.stopImmediatePropagation();
            if (layer.visible) {
                layer.hide();
            }
            else {
                yield layer.show();
            }
            this.setLayerZOrder();
            return false;
        });
    }
    updateTimeSliders() {
        // Update timesliders
        this.timeSliders = [...this.jobLayers, ...this.jobInputLayers].reduce((sliders, layer) => {
            if (time_slider_1.instanceOfTimeSliderSubscriber(layer) && layer.sliderEnabled) {
                sliders.push(layer.slider);
            }
            return sliders;
        }, []);
    }
    renderUpdatedLayer(layer) {
        return __awaiter(this, void 0, void 0, function* () {
            yield layer.updateLayer();
            if (!layer.visible) {
                yield layer.show();
            }
            this.setLayerZOrder();
        });
    }
    setLayerZOrder() {
        let prevMapboxLayerId;
        // Place job layers below the following two mapbox layers: 'place_label_city_small_s' or 'settlement-label'
        if (typeof this.layerService.mapboxGl.getLayer("place_label_city_small_s") !==
            "undefined") {
            prevMapboxLayerId = "place_label_city_small_s";
        }
        else if (typeof this.layerService.mapboxGl.getLayer("settlement-label") !==
            "undefined") {
            prevMapboxLayerId = "settlement-label";
        }
        ;
        [...this.jobLayers, ...this.jobInputLayers].forEach((layer, idx) => {
            if (!layer.visible) {
                return;
            }
            if (mapbox_gl_layer_1.MapboxGlLayer.isInstanceOf(layer) &&
                typeof layer.mapboxGlLayer !== "undefined") {
                this.layerService.mapboxGl.moveLayer(layer.mapboxGlLayer.id, prevMapboxLayerId);
                prevMapboxLayerId = layer.mapboxGlLayer.id;
            }
            else if (map_editable_feature_layer_1.EditableFeatureCollectionLayer.isInstanceOf(layer)) {
                layer.mapboxLayers.forEach(mbl => this.layerService.mapboxGl.moveLayer(mbl.mapboxGlLayer.id));
            }
        });
    }
    zoomToJobBbox() {
        return new Promise(resolve => {
            if (typeof this.currentJob.boundingBox4326 !== "undefined") {
                this.layerService.mapboxGl.once("moveend", resolve);
                if (this.currentJob.status === job_base_1.JobStatus.FINISHED) {
                    this.fitMapTo4326Bbox(this.currentJob.boundingBox4326, 1.5, 14);
                }
                else {
                    this.fitMapTo4326Bbox(this.currentJob.boundingBox4326, 1.5, 10);
                }
            }
        });
    }
    fitMapTo4326Bbox(boundingBox, duration = 1.5, maxZoom) {
        if (Array.isArray(boundingBox)) {
            this.layerService.mapboxGl.fitBounds(boundingBox, { duration, maxZoom });
        }
    }
    toggleFeatureEdit(keepChanges) {
        if (map_editable_feature_layer_1.EditableFeatureCollectionLayer.mode === "edit") {
            map_editable_feature_layer_1.EditableFeatureCollectionLayer.disableEditMode([...this.jobLayers, ...this.jobInputLayers].filter(l => map_editable_feature_layer_1.EditableFeatureCollectionLayer.isInstanceOf(l)), keepChanges);
        }
        else {
            const drawEditButtonBounds = this.mapboxDrawEditButton.nativeElement.getBoundingClientRect();
            this.mapPopupService.showPopup({
                title: "Edit features",
                coordinates: {
                    x: drawEditButtonBounds.left + drawEditButtonBounds.width / 2,
                    y: drawEditButtonBounds.top + drawEditButtonBounds.height / 2,
                },
                formOnCancelFn: () => this.toggleFeatureEdit(false),
                formOnSubmitFn: () => this.toggleFeatureEdit(true),
                background: false,
            });
            map_editable_feature_layer_1.EditableFeatureCollectionLayer.enableEditMode();
        }
    }
    //Event bind for popluation drop down
    getSelectedPopulation(event) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.currentJob.loadPopulation(event.value.name);
            //getLastFireStep() returns the last step for popluation as well
            let totalminutes = (this.currentJob.getLastFireStep() - 1) * 10;
            this.timeSliderStep = totalminutes;
            //create legends
            this.activities = this.currentJob.getPopulationColorLegends();
            //setup time
            let hours = Math.floor(totalminutes / 60);
            let minutes = totalminutes % 60;
            let minutesSTR = String(minutes).padStart(2, "0");
            let hoursSTR = String(hours).padStart(2, "0");
            this.timeFromSlider = hoursSTR + ":" + minutesSTR;
            this.configForEES.time = this.timeFromSlider;
            this.configForEES.population = event.value.name;
            console.log("Selected pop" + JSON.stringify(event.value));
            console.log("Config" + JSON.stringify(this.configForEES));
        });
    }
    //Event bind for fire drop down
    getSelectedFire(event) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.currentJob.loadFire(event.value.name);
            let totalminutes = this.currentJob.getLastFireStep() * 10;
            this.timeSliderStep = totalminutes;
            let hours = Math.floor(totalminutes / 60);
            let minutes = totalminutes % 60;
            let minutesSTR = String(minutes).padStart(2, "0");
            let hoursSTR = String(hours).padStart(2, "0");
            this.timeFromSlider = hoursSTR + ":" + minutesSTR;
            this.configForEES.time = this.timeFromSlider;
            this.configForEES.fire = event.value.name;
            console.log("Selected evac message" + JSON.stringify(event.value));
            console.log("Config" + JSON.stringify(this.configForEES));
        });
    }
    //Event bind for speed slider
    getMaxSpeed(event) {
        this.configForEES.speed = event.value;
        console.log("Selected evac message" + JSON.stringify(event.value));
        console.log("Config" + JSON.stringify(this.configForEES));
    }
    //Event bind for evac message drop down
    getEvacMessage(event) {
        this.configForEES.evacMessage = event.value.message;
        console.log("Selected evac message" + JSON.stringify(event.value.message));
        console.log("Config" + JSON.stringify(this.configForEES));
    }
    //Get selected region/layer from orderlist
    getSelectedLayer(event) {
        //console.log("before config file" + JSON.stringify(this.configForEES))
        //Reset config file when region change
        this.configForEES = { region: "", population: "none", fire: "none", evacMessage: "NONE", speed: "60", time: "00:00", crs: "", finalMessageList: {} };
        console.log("default config file" + JSON.stringify(this.configForEES));
        // Clear fire layers when region changes
        this.currentJob.clearFirelayers();
        // Clear population layers when region changes
        this.currentJob.clearPopulationlayers();
        // clear popluation legends
        this.activities = {};
        //save the region
        this.selectedRegion = this.selectedLayers[0].name;
        this.configForEES.region = this.selectedLayers[0]["_mapboxGlLayer"]["id"];
        console.log("Selected region" + JSON.stringify(this.selectedRegion));
        console.log("after Config" + JSON.stringify(this.configForEES));
        // save coordinate system
        this.configForEES.crs = this.regionData[this.selectedLayers[0]["_mapboxGlLayer"]["id"]]["crs"];
        this.finalMessageList.spatialReferenceEPSG = this.regionData[this.selectedLayers[0]["_mapboxGlLayer"]["id"]]["crs"];
        // Change camera position when region changes
        this.flyCameraToRegion(this.regionData[this.selectedLayers[0]["_mapboxGlLayer"]["id"]]["center"]);
        //console.log(this.regionData[this.selectedLayers[0]["_mapboxGlLayer"]["id"]]["crs"])
        this.zoneVisibility = false;
        this.currentJob.createZoneLayer(this.selectedLayers[0]["_mapboxGlLayer"]["id"]);
        this.clearZoneLayers();
        this.enteredEvacMessages = [];
        this.messageListOptions = [];
        this.finalMessageList.messages = [];
    }
    //Event handler for animation speed setup slider
    setAnimationSpeed(event) {
        this.currentJob.setupAnimationSpeed(this.animationSpeed);
    }
    /**
     * Event Hnadler for time slider
     *
     */
    getSelectedTime(event) {
        let totalminutes = event.value;
        console.log("getSelectedtime" + totalminutes);
        let hours = Math.floor(parseInt(totalminutes) / 60);
        let minutes = parseInt(totalminutes) % 60;
        let minutesSTR = String(minutes).padStart(2, "0");
        let hoursSTR = String(hours).padStart(2, "0");
        this.timeFromSlider = hoursSTR + ":" + minutesSTR;
        this.configForEES.time = this.timeFromSlider;
        this.currentJob.filterFireLayers(totalminutes);
        this.currentJob.filterPopulationLayers(totalminutes);
        let date = new Date();
        if (parseInt(minutesSTR) > 0 && parseInt(minutesSTR) < 15) {
            minutesSTR = "00";
        }
        if (parseInt(minutesSTR) > 15 && parseInt(minutesSTR) < 30) {
            minutesSTR = "15";
        }
        if (parseInt(minutesSTR) > 30 && parseInt(minutesSTR) < 45) {
            minutesSTR = "30";
        }
        if (parseInt(minutesSTR) > 45 && parseInt(minutesSTR) < 60) {
            minutesSTR = "45";
        }
        date.setHours(parseInt(hoursSTR));
        date.setMinutes(parseInt(minutesSTR));
        date.setSeconds(0);
        this.selectedMessageSendTime = date;
    }
    showEmergencyMessageDialog() {
        console.log("showEmergencyMessageDialog()");
        if (this.emergencyMessageDialog || this.updateMessage) {
            this.emergencyMessageDialog = false;
            this.updateMessage = false;
            this.removeShiftSelectedZones();
        }
        else {
            this.emergencyMessageDialog = true;
            this.updateMessage = false;
            this.Errors.duplicate = false;
        }
    }
    /**
     * This will add new Evacuation message to the list
     */
    addNewMessage() {
        //this.cities.push({ "name": this.broadcastZones, "code": "none" })
        if (this.selectedEvacMessage == undefined) {
            this.Errors.messageType = true;
            return;
        }
        if (this.selectedMessageSendTime == undefined) {
            this.Errors.time = true;
            return;
        }
        if (this.messageContent == undefined || this.messageContent == " " || this.messageContent == null) {
            this.Errors.content = true;
            return;
        }
        let message = this.selectedEvacMessage;
        if (message["message"] == "NONE") {
            this.Errors.messageType = true;
            return;
        }
        this.Errors.messageType = false;
        this.Errors.time = false;
        this.Errors.content = false;
        let time = this.selectedMessageSendTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        let broadcastHHMM = time.slice(0, 2) + time.slice(3);
        if (this.shiftSelectedZones.length > 0) {
            console.log("shift count" + this.shiftSelectedZones.length);
            for (var i = 0; i < this.shiftSelectedZones.length; i++) {
                let obj = { "type": message["message"], "broadcastHHMM": broadcastHHMM, "broadcastZones": this.shiftSelectedZones[i], "content": this.messageContent };
                for (var j = 0; j < this.enteredEvacMessages.length; j++) {
                    if (this.enteredEvacMessages[j].type == obj["type"] && this.enteredEvacMessages[j].broadcastHHMM == obj["broadcastHHMM"] && this.enteredEvacMessages[j].broadcastZones == obj["broadcastZones"]) {
                        this.Errors.duplicate = true;
                        return;
                    }
                }
            }
        }
        else {
            let obj = { "type": message["message"], "broadcastHHMM": broadcastHHMM, "broadcastZones": this.broadcastZones, "content": this.messageContent };
            for (var i = 0; i < this.enteredEvacMessages.length; i++) {
                if (this.enteredEvacMessages[i].type == obj["type"] && this.enteredEvacMessages[i].broadcastHHMM == obj["broadcastHHMM"] && this.enteredEvacMessages[i].broadcastZones == obj["broadcastZones"]) {
                    this.Errors.duplicate = true;
                    return;
                }
            }
        }
        this.Errors.duplicate = false;
        if (this.shiftSelectedZones.length > 0) {
            console.log("shift count add " + this.shiftSelectedZones.length);
            for (var i = 0; i < this.shiftSelectedZones.length; i++) {
                this.enteredEvacMessages = [...this.enteredEvacMessages, { "type": message["message"], "broadcastHHMM": broadcastHHMM, "broadcastZones": this.shiftSelectedZones[i], "content": this.messageContent }];
            }
        }
        else {
            this.enteredEvacMessages = [...this.enteredEvacMessages, { "type": message["message"], "broadcastHHMM": broadcastHHMM, "broadcastZones": this.broadcastZones, "content": this.messageContent }];
            // Create a zone layer for this message
            this.createSingleZoneLayer(this.selectedZone);
        }
        //Sort by broadcast time
        this.enteredEvacMessages = this.enteredEvacMessages.sort((n1, n2) => {
            if (n1.broadcastHHMM > n2.broadcastHHMM) {
                return 1;
            }
            if (n1.broadcastHHMM < n2.broadcastHHMM) {
                return -1;
            }
            return 0;
        });
        if (this.shiftSelectedZones.length > 0) {
            // this.messageListOptions = this.enteredEvacMessages.map((item, index) => ({ value: index, label: item.broadcastHHMM, type: item.type, zone: item.broadcastZones, content: item.content }))
            console.log("here");
            this.messageListOptions = [...this.messageListOptions, { "type": message["message"], "label": broadcastHHMM, "zone": this.shiftSelectedZones.toString(), "content": this.messageContent }];
            // Making empty to listen individual click events
            this.shiftSelectedZones = [];
        }
        else {
            console.log("here2");
            //this.messageListOptions = this.enteredEvacMessages.map((item, index) => ({ value: index, label: item.broadcastHHMM, type: item.type, zone: item.broadcastZones, content: item.content }))
            this.messageListOptions = [...this.messageListOptions, { "type": message["message"], "label": broadcastHHMM, "zone": this.broadcastZones, "content": this.messageContent }];
        }
        //Sort by broadcast time
        this.messageListOptions = this.messageListOptions.sort((n1, n2) => {
            if (n1.label > n2.label) {
                return 1;
            }
            if (n1.label < n2.label) {
                return -1;
            }
            return 0;
        });
        this.messageListOptions = this.messageListOptions.map((item, index) => ({ value: index, label: item.label, type: item.type, zone: item.zone, content: item.content }));
        //console.log(this.enteredEvacMessages)
    }
    deleteMessageHandler(i) {
        if (this.messageListOptions[i]["zone"].indexOf(',') != -1) {
            console.log("indexof");
            let zones = this.messageListOptions[i]["zone"].split(',');
            for (let j = 0; j < zones.length; j++) {
                //console.log("zone" + zones[i])
                //this.highlightZone2(zones[i], zones.length)
                let obj = { "type": this.messageListOptions[i]["type"], "broadcastHHMM": this.messageListOptions[i]["label"], "broadcastZones": zones[j], "content": this.messageListOptions[i]["content"] };
                for (var k = 0; k < this.enteredEvacMessages.length; k++) {
                    if (this.enteredEvacMessages[k].type == obj["type"] && this.enteredEvacMessages[k].broadcastHHMM == obj["broadcastHHMM"] && this.enteredEvacMessages[k].broadcastZones == obj["broadcastZones"]) {
                        this.deleteMessage(0, k, 2);
                        console.log("multiple");
                    }
                }
            }
            this.messageListOptions.splice(i, 1);
        }
        else {
            let obj = { "type": this.messageListOptions[i]["type"], "broadcastHHMM": this.messageListOptions[i]["label"], "broadcastZones": this.messageListOptions[i]["zone"], "content": this.messageListOptions[i]["content"] };
            for (var k = 0; k < this.enteredEvacMessages.length; k++) {
                if (this.enteredEvacMessages[k].type == obj["type"] && this.enteredEvacMessages[k].broadcastHHMM == obj["broadcastHHMM"] && this.enteredEvacMessages[k].broadcastZones == obj["broadcastZones"]) {
                    this.deleteMessage(i, k, 1);
                    console.log("single");
                }
                //this.deleteMessage(i, 1)
                //console.log("single")
            }
        }
    }
    /**
     * Delete selected evacuation messages
     * @param i index of selected item
     */
    deleteMessage(messageListIndex, i, length) {
        const count = this.enteredEvacMessages.reduce((pre, cur) => (cur.broadcastZones === this.enteredEvacMessages[i]["broadcastZones"]) ? ++pre : pre, 0);
        console.log("count" + count);
        //Delete layer attached to this message
        if (count == 1) {
            this.deleteSingleZoneLayer(this.enteredEvacMessages[i]["broadcastZones"]);
        }
        // delete this.enteredEvacMessages[i]
        this.enteredEvacMessages.splice(i, 1);
        if (length == 1) {
            this.messageListOptions.splice(messageListIndex, 1);
        }
    }
    /**
     * Update error messages when Evacuation messages drop down changes
     */
    updateErrorMessagesType() {
        if (this.selectedEvacMessage != undefined) {
            this.Errors.messageType = false;
            this.Errors.duplicate = false;
        }
        if (this.selectedMessageSendTime != undefined) {
            this.Errors.time = false;
            this.Errors.duplicate = false;
        }
        let message = this.selectedEvacMessage;
        if (message["message"] == "NONE") {
            this.Errors.messageType = false;
        }
    }
    /**
   * Update error messages when Time selector changes
   */
    updateErrorMessagesTime() {
        if (this.selectedMessageSendTime != undefined) {
            this.Errors.time = false;
            this.Errors.duplicate = false;
        }
    }
    /**
     * This will create the final evac message list for scenario_messages.json
     */
    createFinalMessagesList() {
        let EVACUATE_NOW = false;
        let EVACUATE_NOW_Index = 0;
        let EMERGENCY_WARNING = false;
        let EMERGENCY_WARNING_Index = 0;
        let WATCHACT = false;
        let WATCHACT_Index = 0;
        let ADVICE = false;
        let ADVICE_Index = 0;
        for (var i = 0; i < this.enteredEvacMessages.length; i++) {
            // evacuate now
            if (this.enteredEvacMessages[i]["type"] == "EVACUATE_NOW") {
                if (EVACUATE_NOW) {
                    this.finalMessageList.messages[EVACUATE_NOW_Index]["broadcastZones"][this.enteredEvacMessages[i].broadcastZones] = null;
                }
                else {
                    let obj = {};
                    obj[this.enteredEvacMessages[i].broadcastZones] = null;
                    this.finalMessageList.messages.push({ "type": this.enteredEvacMessages[i].type, "broadcastHHMM": this.enteredEvacMessages[i].broadcastHHMM, "content": this.enteredEvacMessages[i].content, "broadcastZones": obj });
                    if (this.enteredEvacMessages[i]["type"] == "EVACUATE_NOW") {
                        if (EVACUATE_NOW == false) {
                            EVACUATE_NOW = true;
                            EVACUATE_NOW_Index = this.finalMessageList.messages.length - 1;
                        }
                    }
                }
            }
            // emergency warning
            if (this.enteredEvacMessages[i]["type"] == "EMERGENCY_WARNING") {
                if (EMERGENCY_WARNING) {
                    this.finalMessageList.messages[EMERGENCY_WARNING_Index]["broadcastZones"][this.enteredEvacMessages[i].broadcastZones] = null;
                }
                else {
                    let obj = {};
                    obj[this.enteredEvacMessages[i].broadcastZones] = null;
                    this.finalMessageList.messages.push({ "type": this.enteredEvacMessages[i].type, "broadcastHHMM": this.enteredEvacMessages[i].broadcastHHMM, "content": this.enteredEvacMessages[i].content, "broadcastZones": obj });
                    if (this.enteredEvacMessages[i]["type"] == "EMERGENCY_WARNING") {
                        if (EMERGENCY_WARNING == false) {
                            EMERGENCY_WARNING = true;
                            EMERGENCY_WARNING_Index = this.finalMessageList.messages.length - 1;
                        }
                    }
                }
            }
            // watch and act
            if (this.enteredEvacMessages[i]["type"] == "WATCH&ACT") {
                if (WATCHACT) {
                    this.finalMessageList.messages[WATCHACT_Index]["broadcastZones"][this.enteredEvacMessages[i].broadcastZones] = null;
                }
                else {
                    let obj = {};
                    obj[this.enteredEvacMessages[i].broadcastZones] = null;
                    this.finalMessageList.messages.push({ "type": this.enteredEvacMessages[i].type, "broadcastHHMM": this.enteredEvacMessages[i].broadcastHHMM, "content": this.enteredEvacMessages[i].content, "broadcastZones": obj });
                    if (this.enteredEvacMessages[i]["type"] == "WATCH&ACT") {
                        if (WATCHACT == false) {
                            WATCHACT = true;
                            WATCHACT_Index = this.finalMessageList.messages.length - 1;
                        }
                    }
                }
            }
            //Advice
            if (this.enteredEvacMessages[i]["type"] == "ADVICE") {
                if (ADVICE) {
                    this.finalMessageList.messages[ADVICE_Index]["broadcastZones"][this.enteredEvacMessages[i].broadcastZones] = null;
                }
                else {
                    let obj = {};
                    obj[this.enteredEvacMessages[i].broadcastZones] = null;
                    this.finalMessageList.messages.push({ "type": this.enteredEvacMessages[i].type, "broadcastHHMM": this.enteredEvacMessages[i].broadcastHHMM, "content": this.enteredEvacMessages[i].content, "broadcastZones": obj });
                    if (this.enteredEvacMessages[i]["type"] == "ADVICE") {
                        if (ADVICE == false) {
                            ADVICE = true;
                            ADVICE_Index = this.finalMessageList.messages.length - 1;
                        }
                    }
                }
            }
        }
        // console.log(this.finalMessageList)
    }
    showZoneLayers() {
        if (this.zoneVisibility) {
            this.zoneVisibility = false;
            this.currentJob.showZoneLayers(this.zoneVisibility);
        }
        else {
            this.zoneVisibility = true;
            this.currentJob.showZoneLayers(this.zoneVisibility);
        }
    }
    /**
     * fly camera to selected region
     * @param center center coordinates of the region
     */
    flyCameraToRegion(center) {
        //DSS:Zoom to simulation area
        this.layerService.mapboxGl.flyTo({
            center: center,
            speed: 0.5,
            zoom: 10
        });
    }
    /**
     * Change map style
     */
    changeMapStyle(event) {
        return __awaiter(this, void 0, void 0, function* () {
            this.mapStyleChanged = true;
            this.layerService.mapboxGl.removeLayer("surf_coast_shire");
            this.layerService.mapboxGl.removeLayer("mount_alexander_shire");
            this.layerService.mapboxGl.removeLayer("yarra_ranges_shire");
            this.layerService.mapboxGl.setStyle('mapbox://styles/mapbox/' + event.value.style);
            this.mapStyle = 'mapbox://styles/mapbox/' + event.value.style;
        });
    }
    /**
     * Create new layers according to selected messages
     */
    createSingleZoneLayer(data) {
        let zone = data["properties"]["SA1_MAIN16"];
        let zoneLayer = new mapbox_gl_layer_1.MapboxGlLayer(zone, {
            id: zone,
            type: "fill",
            source: zone,
            paint: {
                'fill-color': 'rgba(200, 100, 240, 0.5)'
            }
        }, {
            id: zone,
            source: {
                type: "geojson",
                data: data,
            },
        });
        zoneLayer.show();
    }
    /**
     * Delete single zone layer
     */
    deleteSingleZoneLayer(id) {
        if (this.layerService.mapboxGl.getLayer(id)) {
            this.layerService.mapboxGl.removeLayer(id);
        }
    }
    highlightZoneHandler(i) {
        console.log("zones" + this.messageListOptions[i]["zone"]);
        if (this.messageListOptions[i]["zone"].indexOf(',') != -1) {
            console.log("containes");
            let zones = this.messageListOptions[i]["zone"].split(',');
            this.isZoneCleared = false;
            for (let i = 0; i < zones.length; i++) {
                this.highlightZone2(zones[i], zones.length);
            }
        }
        else {
            this.highlightZone2(this.messageListOptions[i]["zone"], 1);
        }
    }
    /**
     * Highlight zone when message selected
     */
    highlightZone2(zone, length) {
        if (this.highlightedZones.includes(zone)) {
            console.log("includes");
            const index = this.highlightedZones.indexOf(zone);
            if (index > -1) {
                this.highlightedZones.splice(index, 1);
            }
            this.layerService.mapboxGl.setPaintProperty(zone, 'fill-color', 'rgba(200, 100, 240, 0.5)');
        }
        else {
            //remove existing highlight layes
            if (this.highlightedZones.length >= 0) {
                if (length == 1) {
                    for (let i = 0; i < this.highlightedZones.length; i++) {
                        this.layerService.mapboxGl.setPaintProperty(this.highlightedZones[i], 'fill-color', 'rgba(200, 100, 240, 0.5)');
                    }
                    this.highlightedZones = [];
                }
                if (length >= 2) {
                    console.log("this.highlightedZones.length" + this.highlightedZones.length);
                    if (!this.isZoneCleared) {
                        console.log(" this.isZoneCleared = false");
                        for (let i = 0; i < this.highlightedZones.length; i++) {
                            this.layerService.mapboxGl.setPaintProperty(this.highlightedZones[i], 'fill-color', 'rgba(200, 100, 240, 0.5)');
                        }
                        this.isZoneCleared = true;
                        this.highlightedZones = [];
                    }
                }
            }
            //this.isZoneCleared = true
            this.highlightedZones.push(zone);
            this.layerService.mapboxGl.setPaintProperty(zone, 'fill-color', 'rgba(200, 100, 240, 1)');
        }
        console.log("highlight" + this.highlightedZones);
    }
    /**
     * Highlight zone when message selected
     */
    highlightZone(i) {
        if (this.highlightedZones.includes(this.enteredEvacMessages[i]["broadcastZones"])) {
            console.log("includes");
            const index = this.highlightedZones.indexOf(this.enteredEvacMessages[i]["broadcastZones"]);
            if (index > -1) {
                this.highlightedZones.splice(index, 1);
            }
            this.layerService.mapboxGl.setPaintProperty(this.enteredEvacMessages[i]["broadcastZones"], 'fill-color', 'rgba(200, 100, 240, 0.5)');
        }
        else {
            console.log("no");
            //remove existing highlight layes
            if (this.highlightedZones.length > 0) {
                this.layerService.mapboxGl.setPaintProperty(this.highlightedZones[0], 'fill-color', 'rgba(200, 100, 240, 0.5)');
                this.highlightedZones = [];
            }
            this.highlightedZones.push(this.enteredEvacMessages[i]["broadcastZones"]);
            this.layerService.mapboxGl.setPaintProperty(this.enteredEvacMessages[i]["broadcastZones"], 'fill-color', 'rgba(200, 100, 240, 1)');
        }
        console.log("highlight" + this.highlightedZones);
    }
    /**
     * Edit evac message
     */
    editMessageDialog(i) {
        console.log("edit message");
        // setup input fields 
        this.broadcastZoneString = "Broadcast Zone : " + this.messageListOptions[i].zone + " Message No : " + (this.messageListOptions[i].value + 1);
        this.updatingMessageNumber = parseInt(this.messageListOptions[i].value);
        let obj = { "message": this.messageListOptions[i].type };
        this.selectedEvacMessage = obj;
        this.messageContent = this.messageListOptions[i].content;
        let date = new Date();
        let hoursSTR = this.messageListOptions[i].label.substr(0, 2);
        let minutesSTR = this.messageListOptions[i].label.substr(2, 3);
        date.setHours(parseInt(hoursSTR));
        date.setMinutes(parseInt(minutesSTR));
        date.setSeconds(0);
        this.selectedMessageSendTime = date;
        this.broadcastZones = this.messageListOptions[i].zone;
        if (!this.updateMessage) {
            this.updateMessage = true;
            this.emergencyMessageDialog = true;
            this.Errors.duplicate = false;
        }
    }
    /**
     * Handle the update between single and multiple messages
     */
    evacuationMessageUpdateHandler() {
        if (this.broadcastZones.indexOf(',') != -1) {
            console.log("indexof");
            let zones = this.broadcastZones.split(',');
            let length = zones.length;
            for (let j = 0; j < zones.length; j++) {
                //this.highlightZone2(zones[i], zones.length)
                let obj = { "type": this.messageListOptions[this.updatingMessageNumber]["type"], "broadcastHHMM": this.messageListOptions[this.updatingMessageNumber]["label"], "broadcastZones": zones[j], "content": this.messageListOptions[this.updatingMessageNumber]["content"] };
                for (var k = 0; k < this.enteredEvacMessages.length; k++) {
                    if (this.enteredEvacMessages[k].type == obj["type"] && this.enteredEvacMessages[k].broadcastHHMM == obj["broadcastHHMM"] && this.enteredEvacMessages[k].broadcastZones == obj["broadcastZones"]) {
                        this.updateMultipleMessages(k, zones[j], j, length);
                    }
                }
            }
        }
        else {
            let obj = { "type": this.messageListOptions[this.updatingMessageNumber]["type"], "broadcastHHMM": this.messageListOptions[this.updatingMessageNumber]["label"], "broadcastZones": this.messageListOptions[this.updatingMessageNumber]["zone"], "content": this.messageListOptions[this.updatingMessageNumber]["content"] };
            for (var k = 0; k < this.enteredEvacMessages.length; k++) {
                if (this.enteredEvacMessages[k].type == obj["type"] && this.enteredEvacMessages[k].broadcastHHMM == obj["broadcastHHMM"] && this.enteredEvacMessages[k].broadcastZones == obj["broadcastZones"]) {
                    this.updateSingleMessage(k);
                }
            }
        }
    }
    /**
     * Update evacuation messages
     */
    updateSingleMessage(messageIndex) {
        if (this.selectedEvacMessage == undefined) {
            this.Errors.messageType = true;
            return;
        }
        if (this.selectedMessageSendTime == undefined) {
            this.Errors.time = true;
            return;
        }
        if (this.messageContent == undefined || this.messageContent == " " || this.messageContent == null) {
            this.Errors.content = true;
            return;
        }
        let message = this.selectedEvacMessage;
        if (message["message"] == "NONE") {
            this.Errors.messageType = true;
            return;
        }
        this.Errors.messageType = false;
        this.Errors.time = false;
        this.Errors.content = false;
        let time = this.selectedMessageSendTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let broadcastHHMM = time.slice(0, 2) + time.slice(3);
        let obj = { "type": message["message"], "broadcastHHMM": broadcastHHMM, "broadcastZones": this.broadcastZones, "content": this.messageContent };
        for (var i = 0; i < this.enteredEvacMessages.length; i++) {
            if (this.enteredEvacMessages[i].type == obj["type"] && this.enteredEvacMessages[i].broadcastHHMM == obj["broadcastHHMM"] && this.enteredEvacMessages[i].broadcastZones == obj["broadcastZones"] && this.enteredEvacMessages[i].content == obj["content"]) {
                this.Errors.duplicate = true;
                return;
            }
        }
        this.Errors.duplicate = false;
        this.enteredEvacMessages[messageIndex] = { "type": message["message"], "broadcastHHMM": broadcastHHMM, "broadcastZones": this.broadcastZones, "content": this.messageContent };
        //Sort by broadcast time
        this.enteredEvacMessages = this.enteredEvacMessages.sort((n1, n2) => {
            if (n1.broadcastHHMM > n2.broadcastHHMM) {
                return 1;
            }
            if (n1.broadcastHHMM < n2.broadcastHHMM) {
                return -1;
            }
            return 0;
        });
        //this.messageListOptions = this.enteredEvacMessages.map((item, index) => ({ value: index, label: item.broadcastHHMM, type: item.type, zone: item.broadcastZones, content: item.content }))
        this.messageListOptions[this.updatingMessageNumber] = { "type": message["message"], "label": broadcastHHMM, "zone": this.broadcastZones, "content": this.messageContent };
        //Sort by broadcast time
        this.messageListOptions = this.messageListOptions.sort((n1, n2) => {
            if (n1.label > n2.label) {
                return 1;
            }
            if (n1.label < n2.label) {
                return -1;
            }
            return 0;
        });
        this.messageListOptions = this.messageListOptions.map((item, index) => ({ value: index, label: item.label, type: item.type, zone: item.zone, content: item.content }));
    }
    /**
    * Update evacuation messages
    */
    updateMultipleMessages(messageIndex, zone, last, length) {
        if (this.selectedEvacMessage == undefined) {
            this.Errors.messageType = true;
            return;
        }
        if (this.selectedMessageSendTime == undefined) {
            this.Errors.time = true;
            return;
        }
        if (this.messageContent == undefined || this.messageContent == " " || this.messageContent == null) {
            this.Errors.content = true;
            return;
        }
        let message = this.selectedEvacMessage;
        if (message["message"] == "NONE") {
            this.Errors.messageType = true;
            return;
        }
        this.Errors.messageType = false;
        this.Errors.time = false;
        this.Errors.content = false;
        let time = this.selectedMessageSendTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let broadcastHHMM = time.slice(0, 2) + time.slice(3);
        let obj = { "type": message["message"], "broadcastHHMM": broadcastHHMM, "broadcastZones": zone, "content": this.messageContent };
        for (var i = 0; i < this.enteredEvacMessages.length; i++) {
            if (this.enteredEvacMessages[i].type == obj["type"] && this.enteredEvacMessages[i].broadcastHHMM == obj["broadcastHHMM"] && this.enteredEvacMessages[i].broadcastZones == obj["broadcastZones"] && this.enteredEvacMessages[i].content == obj["content"]) {
                this.Errors.duplicate = true;
                return;
            }
        }
        this.Errors.duplicate = false;
        this.enteredEvacMessages[messageIndex] = { "type": message["message"], "broadcastHHMM": broadcastHHMM, "broadcastZones": zone, "content": this.messageContent };
        //Sort by broadcast time
        this.enteredEvacMessages = this.enteredEvacMessages.sort((n1, n2) => {
            if (n1.broadcastHHMM > n2.broadcastHHMM) {
                return 1;
            }
            if (n1.broadcastHHMM < n2.broadcastHHMM) {
                return -1;
            }
            return 0;
        });
        //this.messageListOptions = this.enteredEvacMessages.map((item, index) => ({ value: index, label: item.broadcastHHMM, type: item.type, zone: item.broadcastZones, content: item.content }))
        if (last + 1 == length) {
            this.messageListOptions[this.updatingMessageNumber] = { "type": message["message"], "label": broadcastHHMM, "zone": this.broadcastZones, "content": this.messageContent };
            //Sort by broadcast time
            this.messageListOptions = this.messageListOptions.sort((n1, n2) => {
                if (n1.label > n2.label) {
                    return 1;
                }
                if (n1.label < n2.label) {
                    return -1;
                }
                return 0;
            });
            this.messageListOptions = this.messageListOptions.map((item, index) => ({ value: index, label: item.label, type: item.type, zone: item.zone, content: item.content }));
        }
    }
    /**
     * Clear individual zones created for evac messages
     */
    clearZoneLayers() {
        for (let i = 0; i < this.enteredEvacMessages.length; i++) {
            this.deleteSingleZoneLayer(this.enteredEvacMessages[i]["broadcastZones"]);
        }
    }
    multipleButtonPressed() {
        this.shiftPressed = true;
        this.shiftReleased = false;
        if (this.shiftSelectedZones.length > 0) {
            this.shiftSelectedZones = [];
        }
        console.log("Shift Presses");
    }
    multipleButtonReleased() {
        this.shiftPressed = false;
        this.shiftReleased = true;
        this.broadcastZoneString = this.shiftSelectedZones.toString();
        this.showEmergencyMessageDialog();
        console.log("Shift released");
    }
    /**
    * Create new layers with shift + selection
    */
    createLayersWithShift(data) {
        let zone = data["properties"]["SA1_MAIN16"];
        if (!this.shiftSelectedZones.includes(zone)) {
            this.shiftSelectedZones.push(zone);
            let zoneLayer = new mapbox_gl_layer_1.MapboxGlLayer(zone, {
                id: zone,
                type: "fill",
                source: zone,
                paint: {
                    'fill-color': 'rgba(200, 100, 240, 0.5)'
                }
            }, {
                id: zone,
                source: {
                    type: "geojson",
                    data: data,
                },
            });
            zoneLayer.show();
        }
    }
    /**
     * Remove all shift+ selected zones
     */
    removeShiftSelectedZones() {
        return __awaiter(this, void 0, void 0, function* () {
            // if messages did not added remove layers
            if (this.shiftSelectedZones.length > 0) {
                for (let i = 0; i < this.shiftSelectedZones.length; i++) {
                    if (this.layerService.mapboxGl.getLayer(this.shiftSelectedZones[i])) {
                        this.layerService.mapboxGl.removeLayer(this.shiftSelectedZones[i]);
                    }
                }
            }
        });
    }
    multipleEvacMessages() {
        if (this.layerService.mapboxGl.getLayer('subgroups-layer')) {
            if (this.multiplePressed) {
                this.multiplePressed = false;
                this.multipleButtonReleased();
            }
            else {
                this.multiplePressed = true;
                this.multipleButtonPressed();
                this.flashMessageService.pushFlashMessage(new message_api_1.FlashMessage({
                    duration: 1500,
                    severity: "info",
                    title: "Evacuation Messages",
                    message: "Multiple Evacuation Messages Selection Enabled",
                }));
            }
        }
    }
};
__decorate([
    core_1.HostListener("document:keyup", ["$event"]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [KeyboardEvent]),
    __metadata("design:returntype", void 0)
], GeowebMapComponent.prototype, "handleKeyboardEvent", null);
__decorate([
    core_1.ViewChild("mapContainer"),
    __metadata("design:type", core_1.ElementRef)
], GeowebMapComponent.prototype, "mapContainer", void 0);
__decorate([
    core_1.ViewChild("mapboxDrawEditButton"),
    __metadata("design:type", core_1.ElementRef)
], GeowebMapComponent.prototype, "mapboxDrawEditButton", void 0);
GeowebMapComponent = __decorate([
    core_1.Component({
        selector: "app-map",
        template: __webpack_require__(/*! ./map.component.html */ "./src/app/geo-web/map/map.component.html"),
        encapsulation: core_1.ViewEncapsulation.None,
        styles: [__webpack_require__(/*! ./map.component.scss */ "./src/app/geo-web/map/map.component.scss")]
    }),
    __metadata("design:paramtypes", [job_service_service_1.JobService,
        rest_api_service_1.RestApiService,
        layer_service_service_1.LayerService,
        map_popup_service_1.PopupFormService,
        core_1.NgZone,
        spinner_service_service_1.SpinnerService,
        core_1.ChangeDetectorRef,
        flash_message_service_1.FlashMessageService])
], GeowebMapComponent);
exports.GeowebMapComponent = GeowebMapComponent;


/***/ }),

/***/ "./src/app/geo-web/map/mapbox-draw-styles.ts":
/*!***************************************************!*\
  !*** ./src/app/geo-web/map/mapbox-draw-styles.ts ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.mapboxDrawStyles = [
    {
        id: "highlight-active-points-halo",
        type: "circle",
        filter: [
            "all",
            ["==", "$type", "Point"],
            ["==", "meta", "feature"],
            ["==", "active", "true"],
        ],
        paint: {
            "circle-radius": 24,
            "circle-color": "#FFF",
        },
    },
    {
        id: "highlight-active-points",
        type: "circle",
        filter: [
            "all",
            ["==", "$type", "Point"],
            ["==", "meta", "feature"],
            ["==", "active", "true"],
        ],
        paint: {
            "circle-radius": 20,
            "circle-color": "#000000",
        },
    },
    {
        id: "inactive-points-halo",
        type: "circle",
        filter: [
            "all",
            ["==", "$type", "Point"],
            ["==", "meta", "feature"],
            ["==", "active", "false"],
        ],
        paint: {
            "circle-radius": 22,
            "circle-color": "#FFF",
        },
    },
    {
        id: "inactive-points",
        type: "circle",
        filter: [
            "all",
            ["==", "$type", "Point"],
            ["==", "meta", "feature"],
            ["==", "active", "false"],
        ],
        paint: {
            "circle-radius": 20,
            "circle-color": "#000000",
        },
    },
    {
        id: "gl-draw-line",
        type: "line",
        filter: ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
        layout: {
            "line-cap": "round",
            "line-join": "round",
        },
        paint: {
            "line-color": "#D20C0C",
            "line-dasharray": [0.2, 2],
            "line-width": 2,
        },
    },
    // polygon fill
    {
        id: "gl-draw-polygon-fill",
        type: "fill",
        filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
        paint: {
            "fill-color": "#D20C0C",
            "fill-outline-color": "#D20C0C",
            "fill-opacity": 0.1,
        },
    },
    // polygon outline stroke
    // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
    {
        id: "gl-draw-polygon-stroke-active",
        type: "line",
        filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
        layout: {
            "line-cap": "round",
            "line-join": "round",
        },
        paint: {
            "line-color": "#D20C0C",
            "line-dasharray": [0.2, 2],
            "line-width": 2,
        },
    },
    // vertex point halos
    {
        id: "gl-draw-polygon-and-line-vertex-halo-inactive",
        type: "circle",
        filter: [
            "all",
            ["==", "meta", "vertex"],
            ["==", "$type", "Point"],
            ["!=", "mode", "static"],
            ["==", "active", "false"],
        ],
        paint: {
            "circle-radius": 9,
            "circle-color": "#FFF",
        },
    },
    {
        id: "gl-draw-polygon-and-line-vertex-halo-active",
        type: "circle",
        filter: [
            "all",
            ["==", "meta", "vertex"],
            ["==", "$type", "Point"],
            ["!=", "mode", "static"],
            ["==", "active", "true"],
        ],
        paint: {
            "circle-radius": 11,
            "circle-color": "#FFF",
        },
    },
    // vertex points
    {
        id: "gl-draw-polygon-and-line-vertex-active",
        type: "circle",
        filter: [
            "all",
            ["==", "meta", "vertex"],
            ["==", "$type", "Point"],
            ["!=", "mode", "static"],
        ],
        paint: {
            "circle-radius": 7,
            "circle-color": "#D20C0C",
        },
    },
    // INACTIVE (static, already drawn)
    // line stroke
    {
        id: "gl-draw-line-static",
        type: "line",
        filter: ["all", ["==", "$type", "LineString"], ["==", "mode", "static"]],
        layout: {
            "line-cap": "round",
            "line-join": "round",
        },
        paint: {
            "line-color": "#000",
            "line-width": 3,
        },
    },
    // polygon fill
    {
        id: "gl-draw-polygon-fill-static",
        type: "fill",
        filter: ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
        paint: {
            "fill-color": "#000",
            "fill-outline-color": "#000",
            "fill-opacity": 0.1,
        },
    },
    // polygon outline
    {
        id: "gl-draw-polygon-stroke-static",
        type: "line",
        filter: ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
        layout: {
            "line-cap": "round",
            "line-join": "round",
        },
        paint: {
            "line-color": "#000",
            "line-width": 3,
        },
    },
];


/***/ }),

/***/ "./src/app/geo-web/server-config-form-model.ts":
/*!*****************************************************!*\
  !*** ./src/app/geo-web/server-config-form-model.ts ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @ng-dynamic-forms/core */ "./node_modules/@ng-dynamic-forms/core/fesm2015/core.js");
const form_interfaces_1 = __webpack_require__(/*! ../form/form-interfaces */ "./src/app/form/form-interfaces.ts");
const user_1 = __webpack_require__(/*! ../../../../shared/src/user/user */ "../shared/src/user/user.ts");
var ServerConfigFormModeKey;
(function (ServerConfigFormModeKey) {
    ServerConfigFormModeKey["Basic"] = "basic";
})(ServerConfigFormModeKey = exports.ServerConfigFormModeKey || (exports.ServerConfigFormModeKey = {}));
exports.serverConfigForm = new form_interfaces_1.FormRootModel();
exports.serverConfigForm.modes = [
    {
        key: ServerConfigFormModeKey.Basic,
        name: "Basic",
        userRoles: [user_1.GeowebUserRoles.Admin],
    },
];
exports.serverConfigForm.defaultMode = exports.serverConfigForm.modes[0];
// This model matches ServerPublicConfigJSON
exports.serverConfigForm.schemaFactory = [
    {
        name: "Server Config",
        modeKeys: [ServerConfigFormModeKey.Basic],
        form: {
            model: [
                new core_1.DynamicInputModel({
                    id: "JOB_DIR",
                    label: "Job directory",
                    validators: {
                        required: null,
                    },
                    errorMessages: {
                        required: "{{ label }} is required",
                    },
                }),
                new core_1.DynamicInputModel({
                    id: "JOB_TEMPLATE_DIR",
                    label: "Job template directory",
                }),
                new core_1.DynamicInputModel({
                    id: "PRIVATE_FILES_DIR",
                    label: "Job template library directories (comma-delimited with no spaces)",
                }),
                new core_1.DynamicInputModel({
                    id: "SPARK_PATH",
                    label: "Geoweb path",
                    validators: {
                        required: null,
                    },
                    errorMessages: {
                        required: "{{ label }} is required",
                    },
                }),
                new core_1.DynamicInputModel({
                    id: "EMV2_PATH",
                    label: "EMV2 path",
                    validators: {
                        required: null,
                    },
                    errorMessages: {
                        required: "{{ label }} is required",
                    },
                }),
                new core_1.DynamicInputModel({
                    id: "OPENCL_PLATFORM_ID",
                    label: "OpenCL Platform ID",
                }),
            ],
        },
    },
];


/***/ }),

/***/ "./src/app/home/home.component.html":
/*!******************************************!*\
  !*** ./src/app/home/home.component.html ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<div class=\"home-container\">\n  <div class=\"home-body-container\" [ngClass]=\"{ 'blur-animate ': afterViewInit }\">\n    <h1 class=\"app-title\">Welcome to EES</h1>\n    <app-disclaimer redirectTo=\"/job\"></app-disclaimer>\n  </div>\n\n  <div class=\"home-geoweb-logo-container\">\n    <img src=\"assets/img/logo/noun_Vajra_302102.svg\" alt=\"INDRA Logo\" class=\"home-geoweb-logo\" [ngClass]=\"{ 'blur-animate ': afterViewInit }\" />\n  </div>\n\n  <img src=\"assets/img/logo/noun_Vajra_302102.svg\" alt=\"INDRA Logo\" id=\"small-logo\" />\n</div>"

/***/ }),

/***/ "./src/app/home/home.component.scss":
/*!******************************************!*\
  !*** ./src/app/home/home.component.scss ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".app-title {\n  font-size: 48px;\n  margin-top: 0;\n  margin-bottom: 60px;\n  color: #272727;\n  text-align: center;\n  z-index: 1;\n  position: relative;\n  text-shadow: 0 2px 2px rgba(0, 0, 0, 0.1); }\n\n@keyframes fadein {\n  from {\n    opacity: 0; }\n  to {\n    opacity: 1; } }\n\n.home-container {\n  background-color: #e0e0e0;\n  height: 100vh;\n  width: 100vw;\n  position: absolute;\n  animation: fadein 300ms cubic-bezier(0.455, 0.03, 0.515, 0.955); }\n\n.home-body-container {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  padding: 20px;\n  width: calc(100vw);\n  z-index: 1;\n  transform: translate(-50%, -50%);\n  -webkit-filter: blur(10px);\n          filter: blur(10px);\n  transition: 1s transform cubic-bezier(0.455, 0.03, 0.515, 0.955), 1s opacity cubic-bezier(0.455, 0.03, 0.515, 0.955);\n  opacity: 0; }\n\n.home-body-container.blur-animate {\n  -webkit-filter: blur(0);\n          filter: blur(0);\n  opacity: 1; }\n\n.home-geoweb-logo-container {\n  position: fixed;\n  top: 0;\n  left: 0;\n  overflow: hidden;\n  z-index: 0;\n  width: 100%;\n  height: 100%; }\n\n@keyframes logo-fadein {\n  from {\n    opacity: 0; }\n  to {\n    opacity: 0.2; } }\n\n.home-geoweb-logo {\n  z-index: 0;\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  width: 100vw;\n  min-width: 200px;\n  max-width: 1000px;\n  touch-action: none;\n  touch-action: none;\n  pointer-events: none;\n  -webkit-filter: blur(5px);\n          filter: blur(5px);\n  opacity: 0.05;\n  animation: logo-fadein 300ms cubic-bezier(0.455, 0.03, 0.515, 0.955); }\n\n#small-logo {\n  position: absolute;\n  left: 50%;\n  transform: translate(-50%, 0);\n  height: 100px;\n  bottom: 100px; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYXdhbm1hY2Jvb2svRG9jdW1lbnRzL2Rzcy9jbGllbnQvc3JjL2FwcC9ob21lL2hvbWUuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxlQUFlO0VBQ2YsYUFBYTtFQUNiLG1CQUFtQjtFQUNuQixjQUFjO0VBQ2Qsa0JBQWtCO0VBQ2xCLFVBQVU7RUFDVixrQkFBa0I7RUFDbEIseUNBQXlDLEVBQUE7O0FBRzNDO0VBQ0U7SUFDRSxVQUFVLEVBQUE7RUFFWjtJQUNFLFVBQVUsRUFBQSxFQUFBOztBQUlkO0VBQ0UseUJBQXlCO0VBQ3pCLGFBQWE7RUFDYixZQUFZO0VBQ1osa0JBQWtCO0VBQ2xCLCtEQUErRCxFQUFBOztBQUdqRTtFQUNFLGtCQUFrQjtFQUNsQixRQUFRO0VBQ1IsU0FBUztFQUNULGFBQWE7RUFDYixrQkFBa0I7RUFDbEIsVUFBVTtFQUNWLGdDQUFnQztFQUNoQywwQkFBa0I7VUFBbEIsa0JBQWtCO0VBQ2xCLG9IQUNvRDtFQUNwRCxVQUFVLEVBQUE7O0FBR1o7RUFDRSx1QkFBZTtVQUFmLGVBQWU7RUFDZixVQUFVLEVBQUE7O0FBR1o7RUFDRSxlQUFlO0VBQ2YsTUFBTTtFQUNOLE9BQU87RUFDUCxnQkFBZ0I7RUFDaEIsVUFBVTtFQUVWLFdBQVc7RUFDWCxZQUFZLEVBQUE7O0FBR2Q7RUFDRTtJQUNFLFVBQVUsRUFBQTtFQUVaO0lBQ0UsWUFBWSxFQUFBLEVBQUE7O0FBSWhCO0VBQ0UsVUFBVTtFQUNWLGtCQUFrQjtFQUNsQixRQUFRO0VBQ1IsU0FBUztFQUVULGdDQUFnQztFQUNoQyxZQUFZO0VBQ1osZ0JBQWdCO0VBQ2hCLGlCQUFpQjtFQUNqQixrQkFBa0I7RUFDbEIsa0JBQWtCO0VBQ2xCLG9CQUFvQjtFQUNwQix5QkFBaUI7VUFBakIsaUJBQWlCO0VBQ2pCLGFBQWE7RUFLYixvRUFBb0UsRUFBQTs7QUFRdEU7RUFDRSxrQkFBa0I7RUFDbEIsU0FBUztFQUNULDZCQUE2QjtFQUM3QixhQUFhO0VBQ2IsYUFBYSxFQUFBIiwiZmlsZSI6InNyYy9hcHAvaG9tZS9ob21lLmNvbXBvbmVudC5zY3NzIiwic291cmNlc0NvbnRlbnQiOlsiLmFwcC10aXRsZSB7XG4gIGZvbnQtc2l6ZTogNDhweDtcbiAgbWFyZ2luLXRvcDogMDtcbiAgbWFyZ2luLWJvdHRvbTogNjBweDtcbiAgY29sb3I6ICMyNzI3Mjc7XG4gIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgei1pbmRleDogMTtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuICB0ZXh0LXNoYWRvdzogMCAycHggMnB4IHJnYmEoMCwgMCwgMCwgMC4xKTtcbn1cblxuQGtleWZyYW1lcyBmYWRlaW4ge1xuICBmcm9tIHtcbiAgICBvcGFjaXR5OiAwO1xuICB9XG4gIHRvIHtcbiAgICBvcGFjaXR5OiAxO1xuICB9XG59XG5cbi5ob21lLWNvbnRhaW5lciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNlMGUwZTA7XG4gIGhlaWdodDogMTAwdmg7XG4gIHdpZHRoOiAxMDB2dztcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBhbmltYXRpb246IGZhZGVpbiAzMDBtcyBjdWJpYy1iZXppZXIoMC40NTUsIDAuMDMsIDAuNTE1LCAwLjk1NSk7XG59XG5cbi5ob21lLWJvZHktY29udGFpbmVyIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDUwJTtcbiAgbGVmdDogNTAlO1xuICBwYWRkaW5nOiAyMHB4O1xuICB3aWR0aDogY2FsYygxMDB2dyk7XG4gIHotaW5kZXg6IDE7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpO1xuICBmaWx0ZXI6IGJsdXIoMTBweCk7XG4gIHRyYW5zaXRpb246IDFzIHRyYW5zZm9ybSBjdWJpYy1iZXppZXIoMC40NTUsIDAuMDMsIDAuNTE1LCAwLjk1NSksXG4gICAgMXMgb3BhY2l0eSBjdWJpYy1iZXppZXIoMC40NTUsIDAuMDMsIDAuNTE1LCAwLjk1NSk7XG4gIG9wYWNpdHk6IDA7XG59XG5cbi5ob21lLWJvZHktY29udGFpbmVyLmJsdXItYW5pbWF0ZSB7XG4gIGZpbHRlcjogYmx1cigwKTtcbiAgb3BhY2l0eTogMTtcbn1cblxuLmhvbWUtZ2Vvd2ViLWxvZ28tY29udGFpbmVyIHtcbiAgcG9zaXRpb246IGZpeGVkO1xuICB0b3A6IDA7XG4gIGxlZnQ6IDA7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIHotaW5kZXg6IDA7XG4gIC8vIGJhY2tncm91bmQtY29sb3I6ICNlM2VhZjA7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDEwMCU7XG59XG5cbkBrZXlmcmFtZXMgbG9nby1mYWRlaW4ge1xuICBmcm9tIHtcbiAgICBvcGFjaXR5OiAwO1xuICB9XG4gIHRvIHtcbiAgICBvcGFjaXR5OiAwLjI7XG4gIH1cbn1cblxuLmhvbWUtZ2Vvd2ViLWxvZ28ge1xuICB6LWluZGV4OiAwO1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogNTAlO1xuICBsZWZ0OiA1MCU7XG4gIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpO1xuICB3aWR0aDogMTAwdnc7XG4gIG1pbi13aWR0aDogMjAwcHg7XG4gIG1heC13aWR0aDogMTAwMHB4O1xuICB0b3VjaC1hY3Rpb246IG5vbmU7XG4gIHRvdWNoLWFjdGlvbjogbm9uZTtcbiAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gIGZpbHRlcjogYmx1cig1cHgpO1xuICBvcGFjaXR5OiAwLjA1O1xuICAvLyB0cmFuc2l0aW9uOiAycyAtd2Via2l0LWZpbHRlciBjdWJpYy1iZXppZXIoMC40NTUsIDAuMDMsIDAuNTE1LCAwLjk1NSk7XG4gIC8vIHRyYW5zaXRpb246IDJzIGZpbHRlciBjdWJpYy1iZXppZXIoMC40NTUsIDAuMDMsIDAuNTE1LCAwLjk1NSk7XG4gIC8vIHRyYW5zaXRpb246IDJzIGZpbHRlciBjdWJpYy1iZXppZXIoMC40NTUsIDAuMDMsIDAuNTE1LCAwLjk1NSksXG4gIC8vICAgMnMgLXdlYmtpdC1maWx0ZXIgY3ViaWMtYmV6aWVyKDAuNDU1LCAwLjAzLCAwLjUxNSwgMC45NTUpO1xuICBhbmltYXRpb246IGxvZ28tZmFkZWluIDMwMG1zIGN1YmljLWJlemllcigwLjQ1NSwgMC4wMywgMC41MTUsIDAuOTU1KTtcbn1cblxuLmhvbWUtZ2Vvd2ViLWxvZ28uYmx1ci1hbmltYXRlIHtcbiAgLy8gZmlsdGVyOiBibHVyKDI1cHgpO1xuICAvLyBvcGFjaXR5OiAwLjQ7XG59XG5cbiNzbWFsbC1sb2dvIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBsZWZ0OiA1MCU7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIDApO1xuICBoZWlnaHQ6IDEwMHB4O1xuICBib3R0b206IDEwMHB4O1xufVxuIl19 */"

/***/ }),

/***/ "./src/app/home/home.component.ts":
/*!****************************************!*\
  !*** ./src/app/home/home.component.ts ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const disclaimer_service_1 = __webpack_require__(/*! ../disclaimer/disclaimer-service */ "./src/app/disclaimer/disclaimer-service.ts");
const router_1 = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm2015/router.js");
const auth_service_1 = __webpack_require__(/*! ../services/auth.service */ "./src/app/services/auth.service.ts");
/**
 * Home component, redirects to login or job (GeoWebComponent)
 *
 * @export
 * @class HomeComponent
 */
let HomeComponent = class HomeComponent {
    constructor(disclaimerService, router, zone, authService) {
        this.disclaimerService = disclaimerService;
        this.router = router;
        this.zone = zone;
        this.authService = authService;
        this.afterViewInit = false;
    }
    ngOnInit() {
        if (!this.authService.isLoggedIn) {
            this.router.navigate(["/login"]);
        }
        else if (this.disclaimerService.disclaimerAgreedTo) {
            this.router.navigate(["/job"]);
        }
    }
    ngAfterViewInit() {
        setTimeout(() => {
            this.zone.run(() => {
                this.afterViewInit = true;
            });
        }, 300);
    }
};
HomeComponent = __decorate([
    core_1.Component({
        selector: "app-home",
        template: __webpack_require__(/*! ./home.component.html */ "./src/app/home/home.component.html"),
        styles: [__webpack_require__(/*! ./home.component.scss */ "./src/app/home/home.component.scss")]
    }),
    __metadata("design:paramtypes", [disclaimer_service_1.DisclaimerSerivce,
        router_1.Router,
        core_1.NgZone,
        auth_service_1.AuthService])
], HomeComponent);
exports.HomeComponent = HomeComponent;


/***/ }),

/***/ "./src/app/jobs/job-class-map.ts":
/*!***************************************!*\
  !*** ./src/app/jobs/job-class-map.ts ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const job_types_1 = __webpack_require__(/*! ../../../../shared/src/job/job-types */ "../shared/src/job/job-types.ts");
const client_job_1 = __webpack_require__(/*! ./job-types/evac/client-job */ "./src/app/jobs/job-types/evac/client-job.ts");
// Maps between job types and job class
exports.jobClassMap = type => {
    switch (type) {
        case job_types_1.JobType.EMV2:
            return client_job_1.Emv2ClientJob;
        default:
            throw `INVALID job type: ${type}`;
    }
};


/***/ }),

/***/ "./src/app/jobs/job-types/evac/client-job.ts":
/*!***************************************************!*\
  !*** ./src/app/jobs/job-types/evac/client-job.ts ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const job_types_1 = __webpack_require__(/*! ../../../../../../shared/src/job/job-types */ "../shared/src/job/job-types.ts");
const inputs_outputs_1 = __webpack_require__(/*! ../../../../../../shared/src/job/job-types/emv2/inputs-outputs */ "../shared/src/job/job-types/emv2/inputs-outputs.ts");
const job_1 = __webpack_require__(/*! ../../job */ "./src/app/jobs/job.ts");
const form_model_1 = __webpack_require__(/*! ./form-model */ "./src/app/jobs/job-types/evac/form-model.ts");
const mapbox_gl_layer_1 = __webpack_require__(/*! src/app/geo-web/map/map-layer/mapbox-gl-layer */ "./src/app/geo-web/map/map-layer/mapbox-gl-layer.ts");
const colour_scheme_1 = __webpack_require__(/*! src/app/geo-web/map/colour-scheme/colour-scheme */ "./src/app/geo-web/map/colour-scheme/colour-scheme.ts");
const rest_api_service_1 = __webpack_require__(/*! src/app/services/rest-api.service */ "./src/app/services/rest-api.service.ts");
const turf_1 = __webpack_require__(/*! @turf/turf */ "./node_modules/@turf/turf/turf.min.js");
const geo_layers_1 = __webpack_require__(/*! @deck.gl/geo-layers */ "./node_modules/@deck.gl/geo-layers/dist/esm/index.js");
const mapbox_1 = __webpack_require__(/*! @deck.gl/mapbox */ "./node_modules/@deck.gl/mapbox/dist/esm/index.js");
class Emv2ClientJob extends job_1.ClientJob {
    constructor() {
        super(...arguments);
        this.type = job_types_1.JobType.EMV2;
        this.mapboxStyle = "mapbox://styles/mapbox/outdoors-v11";
        this.inputFormModel = form_model_1.emv2FormRootModel;
        this.inputShapeFc = turf_1.featureCollection([]);
        this.animationSpeed = 60;
        this.animateFirstTime = true;
        this.animateThreshold = false;
        this.threshold = 0;
        this.gap = 0;
        this.animateGap = false;
        this.animateThresholdEnd = false;
        this.thresholdEnd = 0;
        this.gapEnd = 0;
        this.animateGapEnd = false;
        this.fireLoaded = false;
        this.step = 1;
        this.animationStartTime = -1;
        this.populationLoaded = false;
        this.populationGeojson = [];
        this.activities = {};
        // converted to minutes
        this.ignitionTime = { "surf_coast_shire": 0, "Mount_Alexander_Shire": 0 };
        //In actual time
        this.ignitionStartTime = "1300";
        this.lastTimeStep = 0;
        this.configForEES = { region: "", population: "", fire: "", evacMessage: "" };
    }
    // public firefile: FireFile
    init() {
        this.inputs = new inputs_outputs_1.Emv2JobInputs();
        this.outputs = new inputs_outputs_1.Emv2JobOutputs();
    }
    createInputLayers() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("create input layers");
            // Creating layer for surf coast shire matSIM network
            this.surfCoastShire = new mapbox_gl_layer_1.MapboxGlLayer("Surf Coast Shire", {
                id: "surf_coast_shire",
                type: "line",
                source: "matsim",
                maxzoom: 0,
                minzoom: 10,
                'source-layer': 'surf_coast_shire_networkP',
                paint: {
                    "line-color": "#7777ff",
                    "line-width": .5,
                },
                filter: ["all"]
            }, {
                id: "matsim",
                source: {
                    type: "vector",
                    tiles: ['http://localhost:8000/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=	webdss:surf_coast_shire_networkP&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}'
                    ],
                },
            });
            //Load population in this region
            this.surfCoastShire.population = {
                options: [
                    {
                        name: "none"
                    },
                    {
                        name: "Anglesea_Weekday_10_000_Persons",
                    },
                    {
                        name: "Anglesea_Sample_1000_Persons",
                    },
                    {
                        name: "Anglesea_Sample_20_Persons",
                    }
                ],
                selected: {
                    name: "none",
                },
            };
            //Setup default maximum speed in this region
            this.surfCoastShire.speed = 60;
            //setup time in time slider
            this.surfCoastShire.time = this.lastTimeStep * 10;
            //Load fires in this region
            this.surfCoastShire.fire = {
                options: [
                    {
                        name: "none"
                    },
                    {
                        name: "Anglesea_evac_test_ffdi104_phx5_2016data_minsup_fh2017_grid",
                    }
                ],
                selected: {
                    name: "none",
                },
            };
            // setup evacuation message 
            this.surfCoastShire.evacMessage = {
                options: [
                    {
                        message: "NONE"
                    },
                    {
                        message: "EVACUATE_NOW",
                    },
                    {
                        message: "EMERGENCY_WARNING",
                    },
                    {
                        message: "WATCH&ACT",
                    },
                    {
                        message: "ADVICE",
                    },
                ],
                selected: {
                    message: "NONE",
                },
            };
            yield this.surfCoastShire.show();
            // Creating layer for Mount Alexander Shire  
            this.mountAlexanderShire = new mapbox_gl_layer_1.MapboxGlLayer("Mount Alexander Shire", {
                id: "mount_alexander_shire",
                type: "line",
                source: "matsim_mas",
                maxzoom: 0,
                minzoom: 10,
                'source-layer': 'mount_alexander_shire_networkP',
                paint: {
                    "line-color": "#7777ff",
                    "line-width": .5,
                },
                filter: ["all"]
            }, {
                id: "matsim_mas",
                source: {
                    type: "vector",
                    tiles: ['http://localhost:8000/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=	webdss:mount_alexander_shire_networkP&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}'],
                },
            });
            //Load population in this region
            this.mountAlexanderShire.population = {
                options: [
                    {
                        name: "none"
                    },
                    {
                        name: "Castlemaine_Archetypes_10_867_Persons",
                    },
                    {
                        name: "Caslemain_Archetypes_100_Persons",
                    },
                    {
                        name: "Castlemaine_Archetypes_30_Persons",
                    },
                ],
                selected: {
                    name: "none",
                },
            };
            //Setup default maximum speed in this region
            this.mountAlexanderShire.speed = 60;
            //setup time in time slider
            this.mountAlexanderShire.time = this.lastTimeStep * 10;
            //Load fires in this region
            this.mountAlexanderShire.fire = {
                options: [
                    {
                        name: "none"
                    },
                    {
                        name: "20181109_mountalex_evac_ffdi50a_grid",
                    },
                    {
                        name: "20181109_mountalex_evac_ffdi50b_grid",
                    },
                    {
                        name: "20181109_mountalex_evac_ffdi50c_grid",
                    },
                    {
                        name: "20181109_mountalex_evac_ffdi50d_grid",
                    },
                    {
                        name: "20181109_mountalex_evac_ffdi75a_grid",
                    },
                    {
                        name: "20181109_mountalex_evac_ffdi75b_grid",
                    },
                    {
                        name: "20181109_mountalex_evac_ffdi75c_grid",
                    },
                    {
                        name: "20181109_mountalex_evac_ffdi75d_grid",
                    },
                    {
                        name: "20181109_mountalex_evac_ffdi100a_grid",
                    },
                    {
                        name: "20181109_mountalex_evac_ffdi100b_grid",
                    },
                    {
                        name: "20181109_mountalex_evac_ffdi100c_grid",
                    },
                    {
                        name: "20181109_mountalex_evac_ffdi100d_grid",
                    }
                ],
                selected: {
                    name: "none",
                },
            };
            // setup evacuation message 
            this.mountAlexanderShire.evacMessage = {
                options: [
                    {
                        message: "NONE"
                    },
                    {
                        message: "EVACUATE_NOW",
                    },
                    {
                        message: "EMERGENCY_WARNING",
                    },
                    {
                        message: "WATCH&ACT",
                    },
                    {
                        message: "ADVICE",
                    },
                ],
                selected: {
                    message: "NONE",
                },
            };
            yield this.mountAlexanderShire.show();
            //yarra ranges shire 
            this.yarraRangesShire = new mapbox_gl_layer_1.MapboxGlLayer("Yarra Ranges Shire", {
                id: "yarra_ranges_shire",
                type: "line",
                maxzoom: 0,
                minzoom: 10,
                source: "matsim_yrs",
                'source-layer': 'yarra_ranges_shire_networkP',
                paint: {
                    "line-color": "#7777ff",
                    "line-width": .5,
                },
                filter: ["all"]
            }, {
                id: "matsim_yrs",
                source: {
                    type: "vector",
                    tiles: ['http://localhost:8000/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=	webdss:yarra_ranges_shire_networkP&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}'
                    ],
                },
            });
            this.yarraRangesShire.population = {
                options: [
                    {
                        name: "none"
                    },
                    {
                        name: "Yarra_Ranges_Archetypes_600_Persons",
                    },
                ],
                selected: {
                    name: "none",
                },
            };
            //Load fires in this region
            this.yarraRangesShire.fire = {
                options: [
                    {
                        name: "none"
                    },
                    {
                        name: "Mount_little_joe_recreation_FDI25_generic_altered_wind_grid",
                    }
                ],
                selected: {
                    name: "none",
                },
            };
            this.yarraRangesShire.time = this.lastTimeStep * 10;
            // this.firePointsLayer,
            // this.selectedFireLayer,
            yield this.yarraRangesShire.show();
            return [
                this.surfCoastShire,
                this.mountAlexanderShire,
                this.yarraRangesShire
            ];
        });
    }
    loadFire(name) {
        return __awaiter(this, void 0, void 0, function* () {
            this.fireFileName = name;
            // console.log("received name" + this.fireFileName)
            if (this.fireFileName !== "" && this.fireFileName !== "none") {
                // let dataURL_Fire = "http://localhost:12345/phoenix/" + this.fireFileName + ".json"
                let dataURL_Fire = this.configService.config.MASTER_WEBSERVER_URL + this.configService.serverConfig.API_TEMP_FILES_URL + "layer-files/phoenix/" + this.fireFileName + ".json";
                this.layerService.clearFileCache();
                let fireData = yield this.layerService.getFile(dataURL_Fire, rest_api_service_1.ResponseType.JSON, ".json", false);
                this.fireFeatures = fireData.features;
                this.fireLoaded = true;
                this.createFireLayers();
            }
            if (this.fireFileName == "none") {
                //Clearing existing firelayers
                this.clearFirelayers();
            }
        });
    }
    loadPopulation(name) {
        return __awaiter(this, void 0, void 0, function* () {
            this.populationFileName = name;
            if (this.populationFileName !== "" && this.populationFileName !== "none") {
                // let dataURL_Fire = "http://localhost:12345/populations/" + this.populationFileName + ".json"
                let dataURL_Fire = this.configService.config.MASTER_WEBSERVER_URL + this.configService.serverConfig.API_TEMP_FILES_URL + "layer-files/populations/" + this.populationFileName + ".json";
                this.layerService.clearFileCache();
                this.populationData = yield this.layerService.getFile(dataURL_Fire, rest_api_service_1.ResponseType.JSON, ".json", false);
                //this.fireFeatures = fireData.features;
                this.populationLoaded = true;
                this.createPopulationLayers();
            }
            if (this.populationFileName == "none") {
                //Clearing existing layers
                this.clearPopulationlayers();
                this.activities = {};
            }
        });
    }
    toJSON() {
        return super.toJSON();
    }
    setBbox() {
        if (typeof this.inputs.fireRasterSelectionGeometry !== "undefined" &&
            this.inputs.fireRasterSelectionGeometry.features.length > 0) {
            this.boundingBox4326 = turf_1.bbox(this.inputs.fireRasterSelectionGeometry);
        }
    }
    /**
     * This will be called when EES job finished
     */
    createSimulationLayer() {
        return __awaiter(this, void 0, void 0, function* () {
            //this.simulationDataURL = "http://localhost:12345/populations/trips.congestion2.deckgl.json"
            //this.layerService.mapboxGl.setStyle(mapStyle)
            this.activities = {};
            console.log("job name" + this.name);
            console.log("Output Dir" + this.outputDirectory);
            console.log("Server URL" + this.configService.config.MASTER_WEBSERVER_URL);
            console.log("Job files" + this.configService.serverConfig.API_JOB_FILES_URL);
            let DataURL = this.configService.config.MASTER_WEBSERVER_URL + this.configService.serverConfig.API_JOB_FILES_URL + this.outputDirectory + "trips.deckgl.json";
            let Data = yield this.layerService.getFile(DataURL, rest_api_service_1.ResponseType.JSON, ".json", false);
            // DSS: Zoom to simulation area
            this.flyPoint = Data[0].path[0];
            // console.log("fly" + this.flyPoint)
            //DSS:Setup simulation start and finish time
            this.simulationStartTime = Data[Data.length - 1].start;
            this.simulationFinishTime = Data[Data.length - 1].finish;
            // console.log("start finish " + this.simulationStartTime + ":" + this.simulationFinishTime)
            //DSS:Create simulation layer(Agents runs on this layer)
            this.maldonTestLayer = new mapbox_1.MapboxLayer({
                id: 'maldonTestLayer',
                type: geo_layers_1.TripsLayer,
                data: Data,
                getPath: d => d.path,
                getTimestamps: d => (d.timestamps),
                getColor: d => (d.colours),
                opacity: 0.6,
                widthMinPixels: 4,
                rounded: true,
                trailLength: 100,
                billboard: false,
                currentTime: 0,
            });
            this.maldonTestLayer.animationSpeed = 60;
            if (this.layerService.mapboxGl.addLayer(this.maldonTestLayer)) {
                // this.animateMaldonTest()
            }
            //DSS:Zoom to simulation area
            this.layerService.mapboxGl.flyTo({
                center: this.flyPoint,
                speed: 0.5,
                zoom: 10
            });
            // Animate fire
            // TODO : this has to be loaded from config file
            //First : Get the user selected fire file name from server (from config file)
            let DataURL_Config = this.configService.config.MASTER_WEBSERVER_URL + this.configService.serverConfig.API_JOB_FILES_URL + this.inputDirectory + "scenario/" + this.name + ".json";
            this.layerService.clearFileCache();
            let configData = yield this.layerService.getFile(DataURL_Config, rest_api_service_1.ResponseType.JSON, ".json", false);
            console.log("fire" + configData["fire"]);
            let selectedFireFile = configData["fire"];
            //let dataURL_Fire = "http://localhost:12345/phoenix/" + selectedFireFile + ".json"
            let dataURL_Fire = this.configService.config.MASTER_WEBSERVER_URL + this.configService.serverConfig.API_TEMP_FILES_URL + "layer-files/phoenix/" + selectedFireFile + ".json";
            this.layerService.clearFileCache();
            let fireData = yield this.layerService.getFile(dataURL_Fire, rest_api_service_1.ResponseType.JSON, ".json", false);
            var features = fireData.features;
            features.sort(function (a, b) {
                if (a.properties.HOUR_BURNT === null)
                    return -1;
                if (b.properties.HOUR_BURNT === null)
                    return 1;
                else
                    return a.properties.HOUR_BURNT - b.properties.HOUR_BURNT;
            });
            var stepMinutes = this.step;
            const lastFeature = features[features.length - 1];
            const totalMinutes = lastFeature.properties.HOUR_BURNT * 60;
            this.totalSteps = Math.ceil(totalMinutes / stepMinutes);
            var j = 0;
            while (features[j].properties.HOUR_BURNT === null)
                j++;
            for (var i = 0; i < this.totalSteps; i++) {
                var threshold = (i * stepMinutes) / 60;
                var sect = {
                    type: "FeatureCollection",
                    features: []
                };
                while (features[j].properties.HOUR_BURNT < threshold) {
                    sect.features.push(features[j]);
                    j++;
                }
                // create fire layer
                var stepStr = i.toString();
                var layer = "phoenix-layer" + stepStr;
                var source = "phoenix-source" + stepStr;
                var fireLayer = new mapbox_gl_layer_1.MapboxGlLayer(layer, {
                    id: layer,
                    type: "fill",
                    source: source,
                    layout: {
                        visibility: "none"
                    },
                    paint: {
                        "fill-color": {
                            property: "E_INTSTY",
                            stops: [[0, "#ffc107"], [100000, "#dc3545"]]
                        },
                        "fill-opacity": 0.4
                    }
                }, {
                    id: source,
                    source: {
                        type: "geojson",
                        data: sect,
                    },
                });
                fireLayer.show();
            }
            return [];
        });
    }
    animateMaldonTest() {
        if (this.animationStartTime == -1) //change this condition to true in first iteration
         {
            this.animationStartTime = Date.now();
        }
        const loopLength = (this.simulationFinishTime - this.simulationStartTime);
        const animationSpeed = this.animationSpeed;
        //const timestamp = (Date.now() / 1000) 
        const timestamp = ((Date.now() - this.animationStartTime) / 1000);
        const loopTime = loopLength / animationSpeed;
        var currentTime;
        this.currentTime = ((timestamp % loopTime) / loopTime) * loopLength + (this.simulationStartTime);
        //console.log("currentTime maldon" + this.currentTime)
        currentTime = this.currentTime;
        // console.log("final current : " + currentTime)
        if (!this.stop) {
            var step = Math.floor(currentTime / 60);
            //Simulate fire
            this.simulateFireLayer(step);
            this.maldonTestLayer.setProps({ currentTime });
            this.animationFrame = requestAnimationFrame(this.animateMaldonTest.bind(this));
        }
    }
    stopAnimation() {
        var temp = this.currentTime;
        var currentTime = temp;
        this.maldonTestLayer.setProps({ currentTime });
        this.animationFrame = requestAnimationFrame(this.stopAnimation.bind(this));
    }
    setupStop() {
        if (this.stop == null) {
            this.stop = false;
        }
        else if (this.stop) {
            this.stop = false;
        }
        else {
            this.stop = true;
        }
    }
    setupAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }
    getAnimationSpeed() {
        return this.animationSpeed;
    }
    removeTripsLayer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.layerService.mapboxGl.getLayer('maldonTestLayer')) {
                this.layerService.mapboxGl.removeLayer('maldonTestLayer');
            }
            this.animationStartTime = -1;
        });
    }
    getTimeStamps() {
        return { "start": this.simulationStartTime, "finish": this.simulationFinishTime };
    }
    getLastFireStep() {
        return this.lastTimeStep;
    }
    getPopulationColorLegends() {
        return this.activities;
    }
    /**
     * Create fire layer on map
     * triggered when fire file selected
     */
    createFireLayers() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.fireLoaded) {
                //console.log("not null" + this.fireFeatures)
                this.clearFirelayers();
                this.fireFeatures.sort(function (a, b) {
                    if (a.properties.HOUR_BURNT === null)
                        return -1;
                    if (b.properties.HOUR_BURNT === null)
                        return 1;
                    else
                        return a.properties.HOUR_BURNT - b.properties.HOUR_BURNT;
                });
                var stepMinutes = 10;
                const lastFeature = this.fireFeatures[this.fireFeatures.length - 1];
                //console.log("last feature " + JSON.stringify(lastFeature))
                const totalMinutes = lastFeature.properties.HOUR_BURNT * 60;
                //console.log("total min" + totalMinutes)
                this.totalSteps = Math.ceil(totalMinutes / stepMinutes);
                this.lastTimeStep = ((parseInt(this.ignitionStartTime.slice(0, 2)) * 60 + parseInt(this.ignitionStartTime.slice(2))) / 10) + (this.totalSteps - 1);
                //console.log("total steps" + totalSteps)
                var j = 0;
                while (this.fireFeatures[j].properties.HOUR_BURNT === null)
                    j++;
                console.log("size" + j);
                for (var i = 0; i < this.totalSteps; i++) {
                    var threshold = (i * stepMinutes) / 60;
                    // console.log("threhold" + threshold)
                    var sect = {
                        type: "FeatureCollection",
                        features: []
                    };
                    while (this.fireFeatures[j].properties.HOUR_BURNT < threshold) {
                        sect.features.push(this.fireFeatures[j]);
                        j++;
                    }
                    var stepStr = i.toString();
                    var layer = "phoenix-layer" + stepStr;
                    var source = "phoenix-source" + stepStr;
                    this.fireLayer = new mapbox_gl_layer_1.MapboxGlLayer(layer, {
                        id: layer,
                        type: "fill",
                        source: source,
                        layout: {
                            visibility: "visible"
                        },
                        paint: {
                            "fill-color": {
                                property: "E_INTSTY",
                                stops: [[0, "#ffc107"], [100000, "#dc3545"]]
                            },
                            "fill-opacity": 0.4
                        }
                    }, {
                        id: source,
                        source: {
                            type: "geojson",
                            data: sect,
                        },
                    });
                    this.fireLayer.show();
                }
            }
        });
    }
    clearFirelayers() {
        if (this.fireLayer !== undefined) {
            if (this.layerService.mapboxGl.getLayer(this.fireLayer.name)) {
                console.log("none clear");
                for (var i = 0; i < this.totalSteps; i++) {
                    this.layerService.mapboxGl.removeLayer("phoenix-layer" + i.toString());
                }
            }
        }
    }
    createPopulationLayers() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.populationLoaded) {
                this.clearPopulationlayers();
                this.populationGeojson = [];
                var stepMinutes = 10;
                let json = this.populationData;
                const lastFeature = json[json.length - 1];
                const totalMinutes = lastFeature.end_hr * 60;
                const totalSteps = Math.ceil(totalMinutes / stepMinutes);
                //console.log("population totalsteps" + totalSteps)
                this.lastTimeStep = totalSteps;
                var whereareyounow = {};
                var currActivities = [];
                for (const plan of json) {
                    if (!(plan.id in whereareyounow)) {
                        whereareyounow[plan.id] = plan;
                    }
                    if (!currActivities.includes(plan.type)) {
                        currActivities.push(plan.type);
                    }
                }
                this.activities = {};
                //currActivities.sort();
                var activityColors = [
                    "#fb3beb",
                    "#396afa",
                    "#fa3c39",
                    "#3bfff8",
                    "#fad339" // must be 6 hex, due to reactive colorpicker feedback loops. more may be required
                ];
                //previous orange = #fbb03b
                //console.log("activityc" + activityColors)
                for (var i = 0; i < currActivities.length; i++) {
                    if (i < activityColors.length) {
                        this.activities[currActivities[i]] = activityColors[i];
                    }
                    else {
                        // seeded colour generator
                        var color = Math.floor(Math.abs(Math.sin(i) * 16777215) % 16777215);
                        var colorStr = color.toString(16);
                        // pad any colors shorter than 6 characters with leading 0s
                        while (colorStr.length < 6) {
                            colorStr = "0" + colorStr;
                        }
                        this.activities[currActivities[i]] = "#" + colorStr;
                        //activityColors.push("#" + color);
                    }
                }
                console.log("activity colors" + JSON.stringify(this.activities));
                //state.currActivities = currActivities;
                var j = 0;
                for (var i = 0; i < totalSteps; i++) {
                    var threshold = (i * stepMinutes / 60);
                    // add all features below the minutes threshold to this structure
                    while (json[j].end_hr < threshold) {
                        whereareyounow[json[j].id] = json[j];
                        j++;
                    }
                    var sect = {
                        type: "FeatureCollection",
                        features: []
                    };
                    for (const k of Object.keys(whereareyounow)) {
                        var feature = {
                            type: "Feature",
                            properties: {
                                person: whereareyounow[k].id,
                                end_hr: whereareyounow[k].end_hr,
                                type: whereareyounow[k].type,
                                color: this.activities[whereareyounow[k].type]
                            },
                            geometry: {
                                type: "Point",
                                coordinates: [whereareyounow[k].x, whereareyounow[k].y]
                            }
                        };
                        sect.features.push(feature);
                    }
                    this.populationGeojson.push(sect);
                }
                console.log("length" + this.populationGeojson.length);
                // create a single layer to conduct animation in
                var layer = "pop-layer";
                var source = "pop-source";
                this.populationLayer = new mapbox_gl_layer_1.MapboxGlLayer(layer, {
                    id: layer,
                    type: "circle",
                    source: source,
                    paint: {
                        "circle-radius": {
                            base: 1.75,
                            stops: [[12, 2], [22, 180]]
                        },
                        "circle-color": {
                            type: "identity",
                            property: "color"
                        },
                        "circle-opacity": 1.0,
                        "circle-opacity-transition": {
                            duration: 0
                        }
                    }
                }, {
                    id: source,
                    source: {
                        type: "geojson",
                        data: this.populationGeojson[143],
                    },
                });
                this.populationLayer.colourScheme = new colour_scheme_1.D3ColourScheme("interpolateYlOrRd");
                this.populationLayer.show();
            }
        });
    }
    clearPopulationlayers() {
        if (this.populationLayer !== undefined) {
            if (this.layerService.mapboxGl.getLayer(this.populationLayer.name)) {
                this.layerService.mapboxGl.removeLayer(this.populationLayer.name);
            }
        }
    }
    /**
     * filter fire layers according to time slider
     * @param stepMinutes Value from time slider
     */
    filterFireLayers(stepMinutes) {
        return __awaiter(this, void 0, void 0, function* () {
            let fireStartStep = ((parseInt(this.ignitionStartTime.slice(0, 2)) * 60 + parseInt(this.ignitionStartTime.slice(2))) / 10);
            //console.log("fireStartStep" + fireStartStep)
            //const fireStartStep = 78
            var totalLayers = this.totalSteps;
            var fireStep = stepMinutes / 10;
            for (var i = 0; i < totalLayers; i++) {
                var layer = "phoenix-layer" + i.toString();
                if (i + fireStartStep <= fireStep)
                    this.layerService.mapboxGl.setLayoutProperty(layer, "visibility", "visible");
                else
                    this.layerService.mapboxGl.setLayoutProperty(layer, "visibility", "none");
            }
        });
    }
    /**
    * filter population layers according to time slider
    * @param stepMinutes Value from time slider
    */
    filterPopulationLayers(stepMinutes) {
        return __awaiter(this, void 0, void 0, function* () {
            stepMinutes = stepMinutes / 10;
            //console.log("filter pop called" + stepMinutes)
            if (stepMinutes > 143) {
                stepMinutes = 143;
            }
            const s = this.layerService.mapboxGl.getSource("pop-source");
            if (typeof s !== "undefined") {
                this.layerService.mapboxGl.getSource("pop-source").setData(this.populationGeojson[stepMinutes]);
            }
        });
    }
    /**
     * Simulate fire
     * @param stepMinutes current minutes in simulation
     */
    simulateFireLayer(stepMinutes) {
        //console.log("received" + stepMinutes)
        let fireStartStep = ((parseInt(this.ignitionStartTime.slice(0, 2)) * 60 + parseInt(this.ignitionStartTime.slice(2))) / this.step);
        //  console.log("fireStartStep" + fireStartStep)
        //const fireStartStep = 78
        var totalLayers = this.totalSteps;
        //console.log("total layers" + totalLayers)
        // var fireStep = stepMinutes / 10
        //var fireStep = ((parseInt(stepMinutes.slice(0, 2)) * 60 + parseInt(stepMinutes.slice(2))) / this.step)
        var fireStep = (stepMinutes / this.step);
        //console.log("fireStep" + fireStep)
        // Todo : what if simulator runs pass the final fire step?
        for (var i = 0; i < totalLayers; i++) {
            var layer = "phoenix-layer" + i.toString();
            if (i + fireStartStep <= fireStep) {
                // console.log("if")
                this.layerService.mapboxGl.setLayoutProperty(layer, "visibility", "visible");
            }
            else {
                // console.log("else")
                this.layerService.mapboxGl.setLayoutProperty(layer, "visibility", "none");
            }
        }
    }
    createZoneLayer(region) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.layerService.mapboxGl.getLayer('subgroups-layer')) {
                this.layerService.mapboxGl.removeLayer('subgroups-layer');
            }
            if (this.layerService.mapboxGl.getLayer('zone-hover')) {
                this.layerService.mapboxGl.removeLayer('zone-hover');
            }
            this.layerService.clearFileCache();
            this.zoneDataURL = this.configService.config.MASTER_WEBSERVER_URL + this.configService.serverConfig.API_TEMP_FILES_URL + "layer-files/zones/" + region + "_SA1.json";
            let Data = yield this.layerService.getFile(this.zoneDataURL, rest_api_service_1.ResponseType.JSON, ".json", false);
            this.zoneLayer = new mapbox_gl_layer_1.MapboxGlLayer('subgroups-layer', {
                id: 'subgroups-layer',
                type: "fill",
                source: 'subgroups',
                paint: {
                    'fill-color': 'rgba(200, 100, 240, 0.4)',
                    'fill-outline-color': '#0009ad'
                }
            }, {
                id: 'subgroups',
                source: {
                    type: "geojson",
                    data: Data,
                },
            });
            this.zoneHoverLayer = new mapbox_gl_layer_1.MapboxGlLayer('zone-hover', {
                id: 'zone-hover',
                type: "fill",
                source: 'zonehover',
                layout: {},
                paint: {
                    'fill-color': 'rgba(200, 100, 240, 1)',
                    'fill-opacity': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        1,
                        0.5
                    ]
                }
            }, {
                id: 'zonehover',
                source: {
                    type: "geojson",
                    data: Data,
                },
            });
        });
    }
    showZoneLayers(visibility) {
        if (visibility) {
            this.zoneLayer.show();
            //this.zoneHoverLayer.show()
        }
        else {
            this.zoneLayer.hide();
            // this.zoneHoverLayer.hide()
        }
    }
    setMapStyle(style) {
        this.mapboxStyle = style;
        console.log(this.mapboxStyle);
    }
}
exports.Emv2ClientJob = Emv2ClientJob;


/***/ }),

/***/ "./src/app/jobs/job-types/evac/form-model.ts":
/*!***************************************************!*\
  !*** ./src/app/jobs/job-types/evac/form-model.ts ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @ng-dynamic-forms/core */ "./node_modules/@ng-dynamic-forms/core/fesm2015/core.js");
const string_1 = __webpack_require__(/*! ../../../../../../shared/src/util/string */ "../shared/src/util/string.ts");
const form_interfaces_1 = __webpack_require__(/*! ../../../form/form-interfaces */ "./src/app/form/form-interfaces.ts");
const user_1 = __webpack_require__(/*! ../../../../../../shared/src/user/user */ "../shared/src/user/user.ts");
var Emv2FormModeKey;
(function (Emv2FormModeKey) {
    Emv2FormModeKey["Basic"] = "basic";
})(Emv2FormModeKey = exports.Emv2FormModeKey || (exports.Emv2FormModeKey = {}));
exports.emv2FormRootModel = new form_interfaces_1.FormRootModel();
exports.emv2FormRootModel.subjectPropertyKey = "inputs";
exports.emv2FormRootModel.modes = [
    {
        key: Emv2FormModeKey.Basic,
        name: "Basic",
        userRoles: [user_1.GeowebUserRoles.User, user_1.GeowebUserRoles.Admin],
    },
];
exports.emv2FormRootModel.defaultMode = exports.emv2FormRootModel.modes[0];
exports.emv2FormRootModel.schemaFactory = () => {
    return [
        {
            name: "Basic",
            modeKeys: [Emv2FormModeKey.Basic],
            form: {
                layout: {
                    fireRasterFilter: {
                        grid: {
                            container: "ui-g-12",
                            group: "ui-g-12",
                            label: "ui-g-12",
                        },
                        element: {
                            group: "formgroup-container formgroup-tabular",
                            children: "formgroup-tabular-child",
                            container: "formgroup-container",
                            label: "formgroup-label",
                        },
                    },
                    min: {
                        grid: {
                            host: "ui-g-4 ui-md-4",
                        },
                    },
                    max: {
                        grid: {
                            host: "ui-g-4 ui-md-4",
                        },
                    },
                    key: {
                        grid: {
                            host: "ui-g-4 ui-md-4",
                        },
                    },
                },
                model: [
                    new core_1.DynamicFormArrayModel({
                        id: "fireRasterFilter",
                        label: "Filter",
                        initialCount: 0,
                        groupFactory: () => [
                            new core_1.DynamicSelectModel({
                                id: `key`,
                                label: "Key",
                                options: [
                                    {
                                        label: "Size",
                                        value: "numcells",
                                    },
                                    {
                                        label: "Max height",
                                        value: "max_flame_ht",
                                    },
                                    {
                                        label: "Max rate of spread",
                                        value: "max_e_ros",
                                    },
                                    {
                                        label: "Max intensity",
                                        value: "max_e_intsty",
                                    },
                                ],
                                value: "numcells",
                                validators: {
                                    required: null,
                                },
                                errorMessages: {
                                    required: "{{ label }} is required",
                                },
                            }),
                            new core_1.DynamicInputModel({
                                id: `min`,
                                label: `Min value`,
                                validators: {
                                    customValidator: string_1.floatValidator,
                                },
                                errorMessages: {
                                    customValidator: string_1.floatValidator.errorMessage,
                                },
                            }),
                            new core_1.DynamicInputModel({
                                id: `max`,
                                label: `Max value`,
                                validators: {
                                    customValidator: string_1.floatValidator,
                                },
                                errorMessages: {
                                    customValidator: string_1.floatValidator.errorMessage,
                                },
                            }),
                        ],
                    }),
                ],
            },
        },
    ];
};


/***/ }),

/***/ "./src/app/jobs/job.ts":
/*!*****************************!*\
  !*** ./src/app/jobs/job.ts ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const job_base_1 = __webpack_require__(/*! ../../../../shared/src/job/job-base */ "../shared/src/job/job-base.ts");
/**
 * Client job base class - all JobTypes extend this class
 *
 * @export
 * @class ClientJob
 */
class ClientJob extends job_base_1.JobBase {
    constructor(name, jobService, configService, layerService) {
        super(name);
        this.jobService = jobService;
        this.configService = configService;
        this.layerService = layerService;
        this.mapboxStyle = "mapbox://styles/mapbox/light-v10";
        this.clientOnly = false;
        this.logFilePath = `${name}/logs.txt`;
        this.debug = console.log;
        this.init();
    }
    /**
     * This allows subclasses to essentially 'add' something to the contructor
     *
     */
    init() { }
    /**
     * This is called when a new job type is loaded (that is the job type has changed)
     *
     * @returns
     */
    createInputLayers() {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
    /**
     * This is called when a job of the currenty loaded job type is loaded/updated
     *
     */
    updateInputLayers() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * This is called when a job finished running (or a FINISHED job is loaded)
     *
     * @returns
     */
    createOutputLayers() {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
    /**
    * DSS:This is called when a job finished running and simulation loaded
    *
    * @returns
    */
    createSimulationLayer() {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
    /**
     * Remove simulation layer created in EMV2
     */
    removeTripsLayer() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
     * DSS:This is called when simulation starts
     *
     * @returns
     */
    animateMaldonTest() { }
    /**
     * DSS:This is called when simulation stop
     *
     * @returns
     */
    stopAnimation() { }
    /**
     * DSS: return the start time and finish time
     * for loaded simluation in seconds
     */
    getTimeStamps() {
    }
    /**
     * start and stop animation frame
     */
    setupStop() {
    }
    /**
     * Setup animation speed
     */
    setupAnimationSpeed(speed) {
    }
    /**
     * returns animation speed
     */
    getAnimationSpeed() {
        return;
    }
    /**
     *  load fire data
     */
    loadFire(name) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
    *  load population data
    */
    loadPopulation(name) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
     * return last fire step time for selected fire
     */
    getLastFireStep() {
        return;
    }
    /**
     * clear loaded fire layers
     */
    clearFirelayers() {
    }
    /**
   * clear loaded population layers
   */
    clearPopulationlayers() {
    }
    /**
     * Change layers according to time slider
     * @param stepMinutes miute steps from time slider
     */
    filterFireLayers(stepMinutes) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
    * filter population layers according to time slider
    * @param stepMinutes Value from time slider
    */
    filterPopulationLayers(stepMinutes) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
     * Handle the visibility of zone layers
     * (This used to enter evacuation messages)
     */
    showZoneLayers(visibility) {
    }
    /**
     * Load zone layer according to selected layer
     * @param region selected region
     */
    createZoneLayer(region) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
     * Simulate fire
     * @param stepMinutes
     */
    simulateFireLayer(stepMinutes) {
    }
    /**
     * return the colors and actions of loaded population data
     */
    getPopulationColorLegends() {
        return;
    }
    /**
     *
     * @param style selected style
     */
    setMapStyle(style) {
    }
    setBbox() { }
    canJobRun() {
        return true;
    }
}
exports.ClientJob = ClientJob;


/***/ }),

/***/ "./src/app/login/login.component.html":
/*!********************************************!*\
  !*** ./src/app/login/login.component.html ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<p-toast position=\"top-right\" baseZIndex=\"2000\"></p-toast>\n\n\n<div class=\"ui-grid-row\">\n  <div class=\"ui-grid-col-8 left-col\">\n\n    <video autoplay muted loop class=\"ui-grid-col-6\" id=\"login-video\" style=\"height:100vh\">\n      <source src=\"../../assets/videos/Login-background-trips-dark-v2.mov\">\n\n    </video>\n  </div>\n  <div class=\"login-container form ui-grid-col-4\">\n    <div class=\"heading\">\n      <p class=\"emergency-h1\">Emergency</p>\n      <p class=\"emergency-h2\">Evacuation Simulator</p>\n    </div>\n    <h1>Login</h1>\n    <form [formGroup]=\"formGroup\" *ngIf=\"!loading\">\n      <dynamic-primeng-form [group]=\"formGroup\" [model]=\"formModel\" (keyup)=\"onEnterKeyPress($event)\"></dynamic-primeng-form>\n    </form>\n    <button *ngIf=\"!loading\" type=\"button\" pButton label=\"Login\" (click)=\"login()\" [disabled]=\"loading || formGroup.invalid\"\n      style=\"float:right; font-size: 16px; font-family: sofia-pro; width: 100%\" class=\"ui-button-raised\"></button>\n  </div>\n</div>\n\n<app-spinner [fullScreenOverlay]=\"true\"></app-spinner>"

/***/ }),

/***/ "./src/app/login/login.component.scss":
/*!********************************************!*\
  !*** ./src/app/login/login.component.scss ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ".login-container.form {\n  max-width: 400px;\n  width: 100%;\n  padding: 10px;\n  /* margin: auto; */\n  margin-top: 8%;\n  font-family: sofia-pro;\n  font-size: 16px; }\n\nh1 {\n  font-size: 25px; }\n\n#login-video {\n  right: 0;\n  bottom: 0;\n  min-width: 100%;\n  height: 100%;\n  top: 0;\n  min-width: 100%;\n  min-height: 100%;\n  z-index: -100;\n  object-fit: cover; }\n\n.heading {\n  left: 1%;\n  z-index: 1000; }\n\n.emergency-h1 {\n  font-family: sofia-pro;\n  font-weight: 900;\n  font-style: normal;\n  font-size: 50px;\n  color: black;\n  margin: 0%; }\n\n.emergency-h2 {\n  font-family: sofia-pro;\n  font-weight: 900;\n  font-style: normal;\n  font-size: 30px;\n  color: black;\n  margin: 0%; }\n\n@media screen and (max-width: 1200px) {\n  .left-col {\n    display: none; }\n  .login-container.form {\n    max-width: 400px;\n    width: 100%;\n    padding: 10px;\n    /* margin: auto; */\n    margin-top: 40%;\n    position: absolute;\n    left: 50%;\n    transform: translate(-50%, -50%); } }\n\n@media screen and (min-width: 1200px) {\n  .login-container.form {\n    margin-left: 1%; } }\n\n@media screen and (max-width: 376px) {\n  .login-container.form {\n    margin-top: 50%; } }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYXdhbm1hY2Jvb2svRG9jdW1lbnRzL2Rzcy9jbGllbnQvc3JjL2FwcC9sb2dpbi9sb2dpbi5jb21wb25lbnQuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLGdCQUFnQjtFQUNoQixXQUFXO0VBQ1gsYUFBYTtFQUNiLGtCQUFBO0VBQ0EsY0FBYztFQUNkLHNCQUFzQjtFQUN0QixlQUFlLEVBQUE7O0FBSWpCO0VBQ0UsZUFBZSxFQUFBOztBQUVqQjtFQUNFLFFBQVE7RUFDUixTQUFTO0VBQ1QsZUFBZTtFQUNmLFlBQVk7RUFDWixNQUFNO0VBQ04sZUFBZTtFQUNmLGdCQUFnQjtFQUdoQixhQUFhO0VBQ2IsaUJBQWlCLEVBQUE7O0FBRW5CO0VBQ0UsUUFBUTtFQUNSLGFBQWEsRUFBQTs7QUFHZjtFQUNFLHNCQUFzQjtFQUN0QixnQkFBZ0I7RUFDaEIsa0JBQWtCO0VBQ2xCLGVBQWU7RUFFZixZQUFZO0VBRVosVUFBVSxFQUFBOztBQUlaO0VBRUUsc0JBQXNCO0VBQ3RCLGdCQUFnQjtFQUNoQixrQkFBa0I7RUFDbEIsZUFBZTtFQUNmLFlBQVk7RUFDWixVQUFVLEVBQUE7O0FBTVo7RUFDRTtJQUNHLGFBQWEsRUFBQTtFQUVoQjtJQUNFLGdCQUFnQjtJQUNoQixXQUFXO0lBQ1gsYUFBYTtJQUNiLGtCQUFBO0lBQ0EsZUFBZTtJQUNmLGtCQUFrQjtJQUNsQixTQUFTO0lBQ1QsZ0NBQWdDLEVBQUEsRUFDakM7O0FBRUg7RUFFRTtJQUVFLGVBQ0YsRUFBQSxFQUFDOztBQUdEO0VBRUU7SUFFRSxlQUFlLEVBQUEsRUFFaEIiLCJmaWxlIjoic3JjL2FwcC9sb2dpbi9sb2dpbi5jb21wb25lbnQuc2NzcyIsInNvdXJjZXNDb250ZW50IjpbIi5sb2dpbi1jb250YWluZXIuZm9ybSB7XG4gIG1heC13aWR0aDogNDAwcHg7XG4gIHdpZHRoOiAxMDAlO1xuICBwYWRkaW5nOiAxMHB4O1xuICAvKiBtYXJnaW46IGF1dG87ICovXG4gIG1hcmdpbi10b3A6IDglO1xuICBmb250LWZhbWlseTogc29maWEtcHJvO1xuICBmb250LXNpemU6IDE2cHg7XG4gIC8vcG9zaXRpb246IGFic29sdXRlO1xuICAvL3RyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpO1xufVxuaDF7XG4gIGZvbnQtc2l6ZTogMjVweDtcbn1cbiNsb2dpbi12aWRlb3tcbiAgcmlnaHQ6IDA7XG4gIGJvdHRvbTogMDtcbiAgbWluLXdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDEwMCU7XG4gIHRvcDogMDtcbiAgbWluLXdpZHRoOiAxMDAlOyBcbiAgbWluLWhlaWdodDogMTAwJTtcbiAgLy8gd2lkdGg6IGF1dG87IFxuICAvL2hlaWdodDogYXV0bzsgXG4gIHotaW5kZXg6IC0xMDA7XG4gIG9iamVjdC1maXQ6IGNvdmVyO1xufVxuLmhlYWRpbmd7XG4gIGxlZnQ6IDElO1xuICB6LWluZGV4OiAxMDAwO1xuIFxufVxuLmVtZXJnZW5jeS1oMXtcbiAgZm9udC1mYW1pbHk6IHNvZmlhLXBybztcbiAgZm9udC13ZWlnaHQ6IDkwMDtcbiAgZm9udC1zdHlsZTogbm9ybWFsO1xuICBmb250LXNpemU6IDUwcHg7XG4gIFxuICBjb2xvcjogYmxhY2s7XG5cbiAgbWFyZ2luOiAwJTtcblxuXG59XG4uZW1lcmdlbmN5LWgye1xuXG4gIGZvbnQtZmFtaWx5OiBzb2ZpYS1wcm87XG4gIGZvbnQtd2VpZ2h0OiA5MDA7XG4gIGZvbnQtc3R5bGU6IG5vcm1hbDtcbiAgZm9udC1zaXplOiAzMHB4O1xuICBjb2xvcjogYmxhY2s7XG4gIG1hcmdpbjogMCU7XG4gIFxuXG5cblxufVxuQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aCA6IDEyMDBweCkge1xuICAubGVmdC1jb2wge1xuICAgICBkaXNwbGF5OiBub25lO1xuICB9XG4gIC5sb2dpbi1jb250YWluZXIuZm9ybSB7XG4gICAgbWF4LXdpZHRoOiA0MDBweDtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBwYWRkaW5nOiAxMHB4O1xuICAgIC8qIG1hcmdpbjogYXV0bzsgKi9cbiAgICBtYXJnaW4tdG9wOiA0MCU7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIGxlZnQ6IDUwJTtcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLCAtNTAlKTtcbiAgfVxufVxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aCA6IDEyMDBweCkge1xuXG4gIC5sb2dpbi1jb250YWluZXIuZm9ybSB7XG5cbiAgICBtYXJnaW4tbGVmdDogMSVcbiAgfVxufVxuXG4gIEBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGggOiAzNzZweCkge1xuXG4gICAgLmxvZ2luLWNvbnRhaW5lci5mb3JtIHtcbiAgXG4gICAgICBtYXJnaW4tdG9wOiA1MCU7XG4gIFxuICAgIH1cblxufVxudWktYnV0dG9ue1xuXG4gIFxufVxuXG4iXX0= */"

/***/ }),

/***/ "./src/app/login/login.component.ts":
/*!******************************************!*\
  !*** ./src/app/login/login.component.ts ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const core_2 = __webpack_require__(/*! @ng-dynamic-forms/core */ "./node_modules/@ng-dynamic-forms/core/fesm2015/core.js");
const string_1 = __webpack_require__(/*! ../../../../shared/src/util/string */ "../shared/src/util/string.ts");
const spinner_service_service_1 = __webpack_require__(/*! ../spinner/spinner-service.service */ "./src/app/spinner/spinner-service.service.ts");
const auth_service_1 = __webpack_require__(/*! ../services/auth.service */ "./src/app/services/auth.service.ts");
const router_1 = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm2015/router.js");
const flash_message_service_1 = __webpack_require__(/*! ../services/flash-message.service */ "./src/app/services/flash-message.service.ts");
const message_api_1 = __webpack_require__(/*! ../../../../shared/src/message-api */ "../shared/src/message-api/index.ts");
/**
 * Renders login form and handles login
 *
 * @export
 * @class LoginComponent
 */
let LoginComponent = class LoginComponent {
    constructor(formService, spinnerService, authService, router, flashMessageService) {
        this.formService = formService;
        this.spinnerService = spinnerService;
        this.authService = authService;
        this.router = router;
        this.flashMessageService = flashMessageService;
        this.loading = false;
        this.formModel = [
            new core_2.DynamicInputModel({
                id: "username",
                label: "Username",
                required: null,
                validators: {
                    required: null,
                    customValidator: string_1.alphaNumericDashesValidator,
                },
                errorMessages: {
                    required: "{{ label }} is required",
                    customValidator: string_1.alphaNumericDashesValidator.errorMessage,
                },
            }),
            new core_2.DynamicInputModel({
                id: "password",
                label: "Password",
                inputType: core_2.DYNAMIC_FORM_CONTROL_INPUT_TYPE_PASSWORD,
                required: null,
                validators: {
                    required: null,
                },
                errorMessages: {
                    required: "{{ label }} is required",
                    incorrect: "Login is incorrect",
                },
            }),
        ];
        this.onEnterKeyPress = e => {
            if (e.key === "Enter") {
                this.login();
                e.srcElement.blur();
            }
        };
        this.formGroup = this.formService.createFormGroup(this.formModel);
    }
    ngOnInit() {
        if (this.authService.isLoggedIn) {
            this.router.navigate(["/"]);
        }
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.formGroup.valid) {
                this.spinnerService.setSpinner(`login`, {
                    name: `Logging in...`,
                    icon: spinner_service_service_1.SpinnerIcon.LineSpin,
                });
                try {
                    yield this.authService.login(this.formGroup.value.username, this.formGroup.value.password);
                }
                catch (error) {
                    this.flashMessageService.pushFlashMessage(new message_api_1.FlashMessage({
                        message: error.error.message || error.message,
                        title: error.statusText,
                    }));
                    if (error.status && error.status === 401) {
                        this.formGroup.markAsDirty();
                    }
                }
                if (this.authService.isLoggedIn) {
                    this.router.navigate(["/"]);
                }
                else {
                    this.formGroup.get("password").setErrors({ incorrect: true });
                }
                this.spinnerService.removeSpinner(`login`);
            }
        });
    }
};
LoginComponent = __decorate([
    core_1.Component({
        selector: "app-login",
        template: __webpack_require__(/*! ./login.component.html */ "./src/app/login/login.component.html"),
        styles: [__webpack_require__(/*! ./login.component.scss */ "./src/app/login/login.component.scss")]
    }),
    __metadata("design:paramtypes", [core_2.DynamicFormService,
        spinner_service_service_1.SpinnerService,
        auth_service_1.AuthService,
        router_1.Router,
        flash_message_service_1.FlashMessageService])
], LoginComponent);
exports.LoginComponent = LoginComponent;


/***/ }),

/***/ "./src/app/services/auth.service.ts":
/*!******************************************!*\
  !*** ./src/app/services/auth.service.ts ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const angular_jwt_1 = __webpack_require__(/*! @auth0/angular-jwt */ "./node_modules/@auth0/angular-jwt/index.js");
const http_1 = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm2015/http.js");
const rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm2015/index.js");
const config_service_1 = __webpack_require__(/*! ./config.service */ "./src/app/services/config.service.ts");
function jwtOptionsFactory(configService) {
    return {
        tokenGetter: getJwt,
        whitelistedDomains: [
            new RegExp("^null$"),
            `${configService.config.HOSTNAME}:${configService.config.RESTAPI_PORT}`,
        ],
        blacklistedRoutes: ["/login"],
    };
}
exports.jwtOptionsFactory = jwtOptionsFactory;
function getJwt() {
    return localStorage.getItem("access_token");
}
exports.getJwt = getJwt;
function setJwt(token) {
    return localStorage.setItem("access_token", token);
}
function clearJwt() {
    return localStorage.removeItem("access_token");
}
const jwtHelper = new angular_jwt_1.JwtHelperService();
/**
 * Handles login, JWT and stores user state variables like username, isloggedin, isadmin...
 *
 * @export
 * @class AuthService
 */
let AuthService = class AuthService {
    constructor(http, configService) {
        this.http = http;
        this.configService = configService;
        this._isLoggedIn = false;
        this._isAdmin = false;
        this._onLoginSubject = new rxjs_1.BehaviorSubject(false);
        this.updateLoginStatus();
    }
    get isLoggedIn() {
        return this._isLoggedIn;
    }
    get isAdmin() {
        return this._isAdmin;
    }
    get username() {
        return this._jwt.username;
    }
    get userRole() {
        return this._jwt.role;
    }
    getLoginSubjectAsObservable() {
        return this._onLoginSubject.asObservable();
    }
    updateLoginStatus() {
        const jwt = getJwt();
        const newLoginStatus = typeof jwt !== "undefined" && !jwtHelper.isTokenExpired(jwt);
        if (newLoginStatus) {
            this._jwt = jwtHelper.decodeToken(jwt);
            this._isAdmin = "role" in this._jwt && this._jwt.role === "admin";
        }
        if (newLoginStatus !== this._isLoggedIn) {
            this._isLoggedIn = newLoginStatus;
            this._onLoginSubject.next(newLoginStatus);
        }
    }
    login(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let response;
            // TODO: use restApiSErvice
            response = yield this.http
                .post(`${this.configService.config.MASTER_WEBSERVER_URL}api/login`, {
                username,
                password,
            })
                .toPromise();
            setJwt(response.token);
            this.updateLoginStatus();
            return true;
        });
    }
    logout() {
        clearJwt();
        this.updateLoginStatus();
    }
};
AuthService = __decorate([
    core_1.Injectable({
        providedIn: "root",
    }),
    __metadata("design:paramtypes", [http_1.HttpClient, config_service_1.ConfigService])
], AuthService);
exports.AuthService = AuthService;


/***/ }),

/***/ "./src/app/services/config.service.ts":
/*!********************************************!*\
  !*** ./src/app/services/config.service.ts ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const electron_service_1 = __webpack_require__(/*! ./electron.service */ "./src/app/services/electron.service.ts");
const environment_1 = __webpack_require__(/*! src/environments/environment */ "./src/environments/environment.ts");
/**
 * Contains configuration for client and server (which is fetched through WebSocketService).
 * This sets client RESTAPI_PORT, HOSTNAME...
 *
 * @export
 * @class ConfigService
 */
let ConfigService = class ConfigService {
    constructor(electronService) {
        this.electronService = electronService;
        this.config = {};
        this.debugMode = false;
        // Set production boolean from Angualr environment file
        this.config.production = environment_1.environment.production;
        this.debugMode = !this.config.production;
    }
    init() {
        return new Promise((resolve, reject) => {
            // Set default RESTAPI_PORT based on wether we a running in produciton
            if (this.config.production) {
                console.log("production");
                // If in production -> either use same port as the window.location, or use 443 for https and 80 for http
                this.config.RESTAPI_PORT =
                    window.location.port !== ""
                        ? parseInt(window.location.port, 10)
                        : location.protocol === "https:"
                            ? 443
                            : 80;
            }
            else {
                console.log("development");
                // If not production -> set port to 8443 for https and 8080 for http
                this.config.RESTAPI_PORT = location.protocol === "https:" ? 8443 : 8080;
            }
            this.config.APP_PATH = "./";
            this.config.HOSTNAME =
                window.location.hostname !== "" ? window.location.hostname : "localhost";
            // // OVERRIDE
            //this.config.HOSTNAME = "ec2-54-206-226-208.ap-southeast-2.compute.amazonaws.com"
            // this.config.RESTAPI_PORT = 80
            if (this.electronService.isElectron) {
                this.config.ELECTRON = true;
                if (this.debugMode) {
                    console.log("APPLYING Electron Config");
                }
                Object.assign(this.config, this.electronService.getConfig());
            }
            else {
                this.config.ELECTRON = false;
            }
            // Prepend 's' to http and ws if the location is https
            const SECURE_S = location.protocol === "https:" ? "s" : "";
            //const SECURE_S = location.protocol === "https:" ? "" : ""
            this.config.MASTER_WEBSOCKET_URL = `ws${SECURE_S}://${this.config.HOSTNAME}:${this.config.RESTAPI_PORT}/ws`;
            this.config.MASTER_WEBSERVER_URL = `http${SECURE_S}://${this.config.HOSTNAME}:${this.config.RESTAPI_PORT}/`;
            // WEB dss - https removed for dev purposes
            // this.config.MASTER_WEBSOCKET_URL = `ws://${
            //   this.config.HOSTNAME
            //   }:${this.config.RESTAPI_PORT}/ws`
            // this.config.MASTER_WEBSERVER_URL = `http://${
            //   this.config.HOSTNAME
            //   }:${this.config.RESTAPI_PORT}/`
            // Assign values to Angular environment obj
            Object.assign(environment_1.environment, this.config);
            resolve();
        });
    }
};
ConfigService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [electron_service_1.ElectronService])
], ConfigService);
exports.ConfigService = ConfigService;


/***/ }),

/***/ "./src/app/services/electron.service.ts":
/*!**********************************************!*\
  !*** ./src/app/services/electron.service.ts ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
exports.getElectronConfig = () => {
    return window.angularConfig;
};
exports.isElectron = () => window && typeof window.angularConfig !== "undefined";
/**
 * If using in Electron context, this handles passing configuration from Electron to Angular
 *
 * @export
 * @class ElectronService
 */
let ElectronService = class ElectronService {
    constructor() {
        // ipcRenderer: typeof ipcRenderer
        // webFrame: typeof webFrame
        // remote: typeof remote
        // childProcess: typeof childProcess
        // fs: typeof fs
        this.isElectron = false;
        this.getConfig = exports.getElectronConfig;
        // Conditional imports
        // if (this.isElectron()) {
        // this.ipcRenderer = (window as any).require("electron").ipcRenderer
        // this.webFrame = (window as any).require("electron").webFrame
        // this.remote = (window as any).require("electron").remote
        // }
        this.isElectron = exports.isElectron();
    }
};
ElectronService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [])
], ElectronService);
exports.ElectronService = ElectronService;


/***/ }),

/***/ "./src/app/services/flash-message.service.ts":
/*!***************************************************!*\
  !*** ./src/app/services/flash-message.service.ts ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm2015/index.js");
/**
 * Provides subject to push flash messages (toast messages)
 *
 * @export
 * @class FlashMessageService
 */
let FlashMessageService = class FlashMessageService {
    constructor() {
        this.flashMessageSubject = new rxjs_1.Subject();
    }
    getFlashMessageObservable() {
        return this.flashMessageSubject.asObservable();
    }
    pushFlashMessage(flashMessage) {
        this.flashMessageSubject.next(flashMessage);
    }
};
FlashMessageService = __decorate([
    core_1.Injectable({
        providedIn: "root",
    }),
    __metadata("design:paramtypes", [])
], FlashMessageService);
exports.FlashMessageService = FlashMessageService;


/***/ }),

/***/ "./src/app/services/job-service.service.ts":
/*!*************************************************!*\
  !*** ./src/app/services/job-service.service.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm2015/index.js");
const auth_service_1 = __webpack_require__(/*! ./auth.service */ "./src/app/services/auth.service.ts");
const config_service_1 = __webpack_require__(/*! ./config.service */ "./src/app/services/config.service.ts");
const job_class_map_1 = __webpack_require__(/*! ../jobs/job-class-map */ "./src/app/jobs/job-class-map.ts");
const job_1 = __webpack_require__(/*! ../jobs/job */ "./src/app/jobs/job.ts");
const layer_service_service_1 = __webpack_require__(/*! ../geo-web/map/map-layer/layer-service.service */ "./src/app/geo-web/map/map-layer/layer-service.service.ts");
/**
 * Contains all job related variables, job/tempalte lists and subjects to observe changes to jobs.
 * These variables are set by WebSocketService
 *
 * @export
 * @class JobService
 */
let JobService = class JobService {
    constructor(authService, configService, injector) {
        this.authService = authService;
        this.configService = configService;
        this.injector = injector;
        this.behaviorSubject = new rxjs_1.BehaviorSubject(undefined);
        this._logs = [];
        this.logsSubject = new rxjs_1.Subject();
        this._availableJobs = [];
        this.availableJobsSubject = new rxjs_1.Subject();
        this._availableJobTemplates = [];
        this.availableJobTemplatesSubject = new rxjs_1.Subject();
        this.availableExtraFilesSubject = new rxjs_1.Subject();
        this.jobSubscription = this.behaviorSubject.subscribe(job => {
            this.currentJob = job;
        });
        this.loginSubscription = this.authService
            .getLoginSubjectAsObservable()
            .subscribe(loggedIn => {
            if (!loggedIn && typeof this.currentJob !== "undefined") {
                this.setCurrentJob(undefined);
            }
        });
    }
    ngOnDestroy() {
        this.jobSubscription.unsubscribe();
        this.loginSubscription.unsubscribe();
    }
    getCurrentJob() {
        return this.currentJob;
    }
    getCurrentJobBehaviourSubject() {
        return this.behaviorSubject;
    }
    getCurrentJobObservable() {
        return this.behaviorSubject.asObservable();
    }
    updateCurrentJob(jobData) {
        // Object.assign(this.currentJob, jobData)
        this.currentJob.fromJSON(jobData);
        if (this.configService.debugMode) {
            console.log("updateCurrentJob");
            console.log(jobData);
        }
        this.behaviorSubject.next(this.currentJob);
    }
    setCurrentJob(job) {
        if (typeof job === "undefined") {
            this.behaviorSubject.next(undefined);
        }
        else if (typeof this.currentJob !== "undefined" &&
            this.currentJob.name === job.name) {
            this.updateCurrentJob(job);
        }
        else if (job instanceof job_1.ClientJob) {
            this.behaviorSubject.next(job);
        }
        else {
            const newJob = new (job_class_map_1.jobClassMap(job.type))(job.name, this, this.configService, this.injector.get(layer_service_service_1.LayerService));
            newJob.fromJSON(job);
            this.behaviorSubject.next(newJob);
        }
        // TODO: if job is being updated (and not changed) only update properties (and detect changes?)
        if (this.configService.debugMode) {
            console.log(this.currentJob);
        }
    }
    getLogs() {
        return this._logs;
    }
    getLogsObservable() {
        return this.logsSubject.asObservable();
    }
    pushToLogs(log) {
        if (this._logs.length > 1000) {
            this._logs.shift();
        }
        this._logs.push(log);
        this.logsSubject.next(this._logs);
    }
    clearLogs() {
        this._logs = [];
        this.logsSubject.next(this._logs);
    }
    getAvailableJobs() {
        return this._availableJobs;
    }
    getAvailableJobsObservable() {
        return this.availableJobsSubject.asObservable();
    }
    setAvailableJob(jobs) {
        this._availableJobs = jobs;
        this.availableJobsSubject.next(this._availableJobs);
    }
    getAvailableJobTemplates() {
        return this._availableJobTemplates;
    }
    getAvailableJobTemplatesObservable() {
        return this.availableJobTemplatesSubject.asObservable();
    }
    setAvailableJobTemplates(jobTemplates) {
        this._availableJobTemplates = jobTemplates;
        this.availableJobTemplatesSubject.next(this._availableJobTemplates);
    }
    getAvailableExtraFiles() {
        return this._availableExtraFiles;
    }
    getAvailableExtraFilesObservable() {
        return this.availableExtraFilesSubject.asObservable();
    }
    setAvailableExtraFiles(extraFiles) {
        this._availableExtraFiles = extraFiles;
        this.availableExtraFilesSubject.next(this._availableExtraFiles);
    }
};
JobService = __decorate([
    core_1.Injectable({
        providedIn: "root",
    }),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_service_1.ConfigService,
        core_1.Injector])
], JobService);
exports.JobService = JobService;


/***/ }),

/***/ "./src/app/services/rest-api.service.ts":
/*!**********************************************!*\
  !*** ./src/app/services/rest-api.service.ts ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const http_1 = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm2015/http.js");
const download_file_1 = __webpack_require__(/*! ../util/download-file */ "./src/app/util/download-file.ts");
const config_service_1 = __webpack_require__(/*! ./config.service */ "./src/app/services/config.service.ts");
var ResponseType;
(function (ResponseType) {
    ResponseType["ArrayBuffer"] = "arraybuffer";
    ResponseType["Blob"] = "blob";
    ResponseType["JSON"] = "json";
    ResponseType["Text"] = "text";
})(ResponseType = exports.ResponseType || (exports.ResponseType = {}));
/**
 * Convenience wrapper over HttpClient
 *
 * @export
 * @class RestApiService
 */
let RestApiService = class RestApiService {
    constructor(http, configService) {
        this.http = http;
        this.configService = configService;
    }
    downloadUrl(url, type = "text/plain", onProgress) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.get(url, ResponseType.ArrayBuffer, onProgress);
            download_file_1.downloadFile(url.substring(url.lastIndexOf("/") + 1), data, type);
        });
    }
    uploadJobFile(file, path, jobName, onProgress) {
        return __awaiter(this, void 0, void 0, function* () {
            const formData = new FormData();
            formData.append("path", path);
            formData.append("job", jobName);
            formData.append("file", file);
            return yield this.post(`${this.configService.config.MASTER_WEBSERVER_URL}${this.configService.serverConfig.API_JOB_FILES_URL}`, formData, ResponseType.Blob, onProgress);
        });
    }
    //receive the file
    get(url, responseType = ResponseType.JSON, onProgress) {
        const reportProgress = typeof onProgress === "function";
        return this.performRequest(new http_1.HttpRequest("GET", url, {}, { responseType, reportProgress }), reportProgress, onProgress);
    }
    post(url, body, responseType = ResponseType.JSON, onProgress) {
        const reportProgress = typeof onProgress === "function";
        return this.performRequest(new http_1.HttpRequest("POST", url, body, { responseType, reportProgress }), reportProgress, onProgress);
    }
    performRequest(request, reportProgress = false, onProgress) {
        if (reportProgress) {
            return new Promise((resolve, reject) => {
                const requestSubscription = this.http.request(request).subscribe(event => {
                    switch (event.type) {
                        case http_1.HttpEventType.Sent:
                            onProgress(Math.round(0));
                            break;
                        case http_1.HttpEventType.UploadProgress:
                        case http_1.HttpEventType.DownloadProgress:
                            onProgress(Math.round((100 / event.total) * event.loaded));
                            break;
                        // Request complete!
                        case http_1.HttpEventType.Response:
                            resolve(event.body);
                            requestSubscription.unsubscribe();
                            break;
                    }
                }, requestError => {
                    reject(requestError);
                    requestSubscription.unsubscribe();
                });
            });
        }
        return this.http.request(request).toPromise();
    }
};
RestApiService = __decorate([
    core_1.Injectable({
        providedIn: "root",
    }),
    __metadata("design:paramtypes", [http_1.HttpClient, config_service_1.ConfigService])
], RestApiService);
exports.RestApiService = RestApiService;


/***/ }),

/***/ "./src/app/services/web-socket.service.ts":
/*!************************************************!*\
  !*** ./src/app/services/web-socket.service.ts ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const reconnecting_websocket_1 = __webpack_require__(/*! reconnecting-websocket */ "../node_modules/reconnecting-websocket/dist/reconnecting-websocket.mjs");
const job_service_service_1 = __webpack_require__(/*! ./job-service.service */ "./src/app/services/job-service.service.ts");
const message_api_1 = __webpack_require__(/*! ../../../../shared/src/message-api */ "../shared/src/message-api/index.ts");
const flash_message_service_1 = __webpack_require__(/*! ./flash-message.service */ "./src/app/services/flash-message.service.ts");
const rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm2015/index.js");
const auth_service_1 = __webpack_require__(/*! ./auth.service */ "./src/app/services/auth.service.ts");
const config_service_1 = __webpack_require__(/*! ./config.service */ "./src/app/services/config.service.ts");
const interfaces_1 = __webpack_require__(/*! ../../../../shared/src/file-provider/interfaces */ "../shared/src/file-provider/interfaces.ts");
/**
 * Handles communication with master server via web-socket.
 * All communication except file transfer and initial login is done through the web-socket:
 * - Fetch/set server config
 * - Fetch job/template lists
 * - Create/Load/Run/Stop/Delete job
 * - Get signed URLs for cloud storage
 * - Receive flash (toast) message from server
 *
 * @export
 * @class WebSocketService
 */
let WebSocketService = class WebSocketService {
    constructor(jobService, flashMessageSerice, authService, configService) {
        this.jobService = jobService;
        this.flashMessageSerice = flashMessageSerice;
        this.authService = authService;
        this.configService = configService;
        this._connected = false;
        this._authenticated = false;
        this.authenticatedSubject = new rxjs_1.BehaviorSubject(false);
        this.updateAvailableJobsInterval = null;
        this.serverConfigSubject = new rxjs_1.BehaviorSubject(undefined);
        this.replyPromises = new Map();
        // Open connection on login and close connection on logout
        this.loginSubscription = this.authService
            .getLoginSubjectAsObservable()
            .subscribe(isLoggedIn => isLoggedIn ? this.openConnection() : this.closeConnection());
        this.serverConfigSubscription = this.serverConfigSubject.subscribe(serverConfig => {
            this.configService.serverConfig = serverConfig;
        });
        this.jobService.resolveDirTree = this.resolveDirTree.bind(this);
    }
    ngOnDestroy() {
        this.loginSubscription.unsubscribe();
        this.serverConfigSubscription.unsubscribe();
    }
    openConnection() {
        console.log("opening websocket connection");
        this.rws = new reconnecting_websocket_1.default(this.configService.config.MASTER_WEBSOCKET_URL, "", {
            maxReconnectionDelay: 5000,
            minReconnectionDelay: 500,
            minUptime: 5000,
            reconnectionDelayGrowFactor: 1.3,
            connectionTimeout: 4000,
        });
        this.rws.addEventListener("open", this.onConnectionOpen.bind(this));
        this.rws.addEventListener("close", this.onConnectionClose.bind(this));
        this.rws.addEventListener("message", this.onMessage.bind(this));
    }
    closeConnection() {
        if (typeof this.rws !== "undefined") {
            console.log("closing websocket connection");
            try {
                this.rws.close();
                this.rws.removeEventListener("message", this.onMessage.bind(this));
            }
            catch (error) {
                console.log(`FAILED to close websocket connection: ${error}`);
            }
        }
    }
    onConnectionOpen(evt) {
        this._connected = true;
        this.authenticate();
        console.log(`opened ${this.rws.url}`);
        this.rws.removeEventListener("open", this.onConnectionOpen.bind(this));
    }
    onConnectionClose(evt) {
        this._connected = false;
        this._authenticated = false;
        this.authenticatedSubject.next(false);
        console.log(`closed ${this.rws.url}`);
        this.rws.removeEventListener("close", this.onConnectionClose.bind(this));
    }
    authenticate() {
        this._authenticated = false;
        this.authenticatedSubject.next(false);
        if (this._connected && this.authService.isLoggedIn) {
            this.rws.send(JSON.stringify({
                type: message_api_1.WebSocketAuthMessageTypes.AuthLogin,
                data: {
                    message: auth_service_1.getJwt(),
                },
            }));
        }
    }
    onAuthenticated() {
        this._authenticated = true;
        this.authenticatedSubject.next(true);
        this.getServerConfig();
        this.updateAvailableJobLists();
        // If the connection has opened and a job has been previously loaded -> reload job
        const currentJob = this.jobService.getCurrentJob();
        if (typeof currentJob !== "undefined") {
            this.getJob({ name: currentJob.name });
        }
    }
    onMessage(evt) {
        let message = {};
        try {
            message = JSON.parse(evt.data);
            if (this.configService.debugMode) {
                console.log(`received message ${evt.data}`);
            }
        }
        catch (e) {
            console.log(`${this.rws.url} failed to parse message - ${evt.data}`);
        }
        if ("type" in message) {
            switch (message.type) {
                // START WEBSOCKET AUTHENTICATION MESSAGES
                case message_api_1.WebSocketAuthMessageTypes.AuthSuccess:
                    this.onAuthenticated();
                    break;
                case message_api_1.WebSocketAuthMessageTypes.AuthFailed:
                case message_api_1.WebSocketAuthMessageTypes.AuthInvalid:
                    this._authenticated = false;
                    this.authenticatedSubject.next(false);
                    const authFailedMesage = message.data;
                    this.flashMessageSerice.pushFlashMessage(new message_api_1.FlashMessage({
                        title: authFailedMesage.message,
                        sticky: true,
                        message: "Your authentication token is invalid. Please log in again.",
                    }));
                    break;
                // START JOB MESSAGES
                case message_api_1.JobMessageTypes.Data:
                    const jobMessage = message.data;
                    this.jobService.setCurrentJob(jobMessage.job);
                    break;
                case message_api_1.JobMessageTypes.PartialData:
                    const jobPartialDataMessage = message.data;
                    this.jobService.updateCurrentJob(jobPartialDataMessage.jobData);
                    break;
                case message_api_1.JobMessageTypes.Status:
                    const statusMessage = message.data;
                    const currentJob = this.jobService.getCurrentJob();
                    if (typeof currentJob !== "undefined") {
                        currentJob.status = statusMessage.status;
                        if ("progress" in statusMessage) {
                            currentJob.progress = statusMessage.progress;
                        }
                        this.jobService.setCurrentJob(currentJob);
                    }
                    break;
                case message_api_1.JobMessageTypes.Log:
                    const logMessage = message.data;
                    this.jobService.pushToLogs(logMessage);
                    break;
                case message_api_1.JobListMessageTypes.Get:
                    const jobListMessage = message.data;
                    this.jobService.setAvailableJob(jobListMessage.list);
                    break;
                case message_api_1.JobListMessageTypes.GetTemplate:
                    const jobTemplatesListMessage = message.data;
                    this.jobService.setAvailableJobTemplates(jobTemplatesListMessage.list);
                    break;
                // START FLASH MESSAGE MESSAGES
                case message_api_1.FlashMessageTypes.General:
                    this.flashMessageSerice.pushFlashMessage(message.data);
                    break;
                // START CONFIG MESSAGES
                case message_api_1.ServerConfigMessageTypes.Data:
                    const serverConfigMessage = new message_api_1.ServerConfigDataMessage(message.data);
                    console.log(serverConfigMessage);
                    this.serverConfigSubject.next(serverConfigMessage.config);
                    break;
                // START MISC MESSAGES
                case message_api_1.IGetDirTreeSignedURLType:
                    const getDirTreeSignedUrlMessage = message.data;
                    const promiseId = `${message_api_1.IGetDirTreeSignedURLType}-${getDirTreeSignedUrlMessage.location}-${getDirTreeSignedUrlMessage.path}`;
                    if (this.replyPromises.has(promiseId)) {
                        this.replyPromises
                            .get(promiseId)
                            .resolve(getDirTreeSignedUrlMessage.url);
                    }
                    break;
                // UNKOWN MESSAGES
                default:
                    console.log(`Received unknown message ${JSON.stringify(message)}`);
                    break;
            }
        }
    }
    sendMessage(message) {
        if (this._authenticated) {
            this.rws.send(JSON.stringify(message));
            if (this.configService.debugMode) {
                console.log(`sent message ${JSON.stringify(message)}`);
            }
        }
    }
    getJob(message) {
        this.sendMessage({ type: message_api_1.JobMessageTypes.Get, data: message });
    }
    runJob(message) {
        this.sendMessage({ type: message_api_1.JobMessageTypes.Run, data: message });
    }
    saveJob(message) {
        this.sendMessage({ type: message_api_1.JobMessageTypes.Data, data: message });
    }
    stopJob(message) {
        this.sendMessage({ type: message_api_1.JobMessageTypes.Stop, data: message });
    }
    newJob(message) {
        this.sendMessage({ type: message_api_1.JobMessageTypes.New, data: message });
    }
    deleteJob(message) {
        if (this.authService.isAdmin) {
            this.sendMessage({ type: message_api_1.JobMessageTypes.Delete, data: message });
        }
    }
    updateAvailableJobLists(interval = -1) {
        if (interval > 0 && this.updateAvailableJobsInterval === null) {
            this.updateAvailableJobsInterval = setInterval(() => {
                this.updateAvailableJobLists(-1);
            }, interval);
        }
        this.sendMessage({ type: message_api_1.JobListMessageTypes.Get, data: {} });
        this.sendMessage({ type: message_api_1.JobListMessageTypes.GetTemplate, data: {} });
    }
    clearUpdateAvailableJobListInterval() {
        if (this.updateAvailableJobsInterval !== null) {
            clearInterval(this.updateAvailableJobsInterval);
            this.updateAvailableJobsInterval = null;
        }
    }
    getServerConfig() {
        this.sendMessage(new message_api_1.ServerConfigGetMessage());
    }
    updateServerConfig() {
        if (this.authService.isAdmin) {
            this.sendMessage(new message_api_1.ServerConfigDataMessage({ config: this.configService.serverConfig }));
        }
    }
    getFileSignedUrl(path, location) {
        return new Promise((resolve, reject) => {
            this.replyPromises.set(`${message_api_1.IGetDirTreeSignedURLType}-${location}-${path}`, { resolve, reject });
            this.sendMessage({
                type: message_api_1.IGetDirTreeSignedURLType,
                data: { path, location },
            });
        });
    }
    resolveDirTree(path, location, publicCloud = false) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (location) {
                case interfaces_1.FileLocation.MasterPublic:
                    return `${this.configService.config.MASTER_WEBSERVER_URL}${this.configService.serverConfig.API_PUBLIC_FILES_URL}${path}`;
                case interfaces_1.FileLocation.MasterPrivate:
                    return `${this.configService.config.MASTER_WEBSERVER_URL}${this.configService.serverConfig.API_PRIVATE_FILES_URL}${path}`;
                case interfaces_1.FileLocation.MasterJob:
                    return `${this.configService.config.MASTER_WEBSERVER_URL}${this.configService.serverConfig.API_JOB_FILES_URL}${path}`;
                case interfaces_1.FileLocation.MasterTemplate:
                    return `${process.env.MASTER_RESTAPI_URL}${this.configService.serverConfig.API_TEMPLATE_FILES_URL}${path}`;
                case interfaces_1.FileLocation.S3:
                    return publicCloud
                        ? `${this.configService.serverConfig.S3_JOB_FILES_BUCKET_URL}${path}`
                        : "";
                case interfaces_1.FileLocation.GCS:
                    return yield this.getFileSignedUrl(path, location);
                case interfaces_1.FileLocation.URL:
                    return `${path}`;
            }
        });
    }
    getServerConfigSubject() {
        return this.serverConfigSubject;
    }
    getAuthenticatedAsObservable() {
        return this.authenticatedSubject.asObservable();
    }
};
WebSocketService = __decorate([
    core_1.Injectable({
        providedIn: "root",
    }),
    __metadata("design:paramtypes", [job_service_service_1.JobService,
        flash_message_service_1.FlashMessageService,
        auth_service_1.AuthService,
        config_service_1.ConfigService])
], WebSocketService);
exports.WebSocketService = WebSocketService;


/***/ }),

/***/ "./src/app/spinner/spinner-consts.ts":
/*!*******************************************!*\
  !*** ./src/app/spinner/spinner-consts.ts ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// Taken from ngx-spinner package - https://github.com/Napster2210/ngx-spinner/blob/master/projects/ngx-spinner/src/lib/ngx-spinner.enum.ts
exports.spinnerDivCounts = {
    "la-ball-8bits": 16,
    "la-ball-atom": 4,
    "la-ball-beat": 3,
    "la-ball-circus": 5,
    "la-ball-climbing-dot": 4,
    "la-ball-clip-rotate": 1,
    "la-ball-clip-rotate-multiple": 2,
    "la-ball-clip-rotate-pulse": 2,
    "la-ball-elastic-dots": 5,
    "la-ball-fall": 3,
    "la-ball-fussion": 4,
    "la-ball-grid-beat": 9,
    "la-ball-grid-pulse": 9,
    "la-ball-newton-cradle": 4,
    "la-ball-pulse": 3,
    "la-ball-pulse-rise": 5,
    "la-ball-pulse-sync": 3,
    "la-ball-rotate": 1,
    "la-ball-running-dots": 5,
    "la-ball-scale": 1,
    "la-ball-scale-multiple": 3,
    "la-ball-scale-pulse": 2,
    "la-ball-scale-ripple": 1,
    "la-ball-scale-ripple-multiple": 3,
    "la-ball-spin": 8,
    "la-ball-spin-clockwise": 8,
    "la-ball-spin-clockwise-fade": 8,
    "la-ball-spin-clockwise-fade-rotating": 8,
    "la-ball-spin-fade": 8,
    "la-ball-spin-fade-rotating": 8,
    "la-ball-spin-rotate": 2,
    "la-ball-square-clockwise-spin": 8,
    "la-ball-square-spin": 8,
    "la-ball-triangle-path": 3,
    "la-ball-zig-zag": 2,
    "la-ball-zig-zag-deflect": 2,
    "la-cog": 1,
    "la-cube-transition": 2,
    "la-fire": 3,
    "la-line-scale": 5,
    "la-line-scale-party": 5,
    "la-line-scale-pulse-out": 5,
    "la-line-scale-pulse-out-rapid": 5,
    "la-line-spin-clockwise-fade": 8,
    "la-line-spin-clockwise-fade-rotating": 8,
    "la-line-spin-fade": 8,
    "la-line-spin-fade-rotating": 8,
    "la-pacman": 6,
    "la-square-jelly-box": 2,
    "la-square-loader": 1,
    "la-square-spin": 1,
    "la-timer": 1,
    "la-triangle-skew-spin": 1,
};


/***/ }),

/***/ "./src/app/spinner/spinner-service.service.ts":
/*!****************************************************!*\
  !*** ./src/app/spinner/spinner-service.service.ts ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const rxjs_1 = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm2015/index.js");
const spinner_consts_1 = __webpack_require__(/*! ./spinner-consts */ "./src/app/spinner/spinner-consts.ts");
// Note: if you add icons to this enum, make sure you also add the corresponding load-awesome css file to client/angular.json
var SpinnerIcon;
(function (SpinnerIcon) {
    SpinnerIcon["Fire"] = "la-fire";
    SpinnerIcon["GridPulse"] = "la-ball-grid-pulse";
    SpinnerIcon["LineSpin"] = "la-line-spin-fade-rotating";
    SpinnerIcon["RotatingCircle"] = "la-ball-clip-rotate";
    SpinnerIcon["Ball8Bit"] = "la-ball-8bits";
    SpinnerIcon["Pacman"] = "la-pacman";
    SpinnerIcon["BallScale"] = "la-ball-scale";
    SpinnerIcon["Square"] = "la-square-loader";
})(SpinnerIcon = exports.SpinnerIcon || (exports.SpinnerIcon = {}));
var SpinnerSize;
(function (SpinnerSize) {
    SpinnerSize["sm"] = "la-sm";
    SpinnerSize["md"] = "";
    SpinnerSize["lg"] = "la-2x";
    SpinnerSize["xl"] = "la-3x";
})(SpinnerSize = exports.SpinnerSize || (exports.SpinnerSize = {}));
/**
 * Provides subjects to create/change/remove spinners. See also SpinnerComponent
 *
 * @export
 * @class SpinnerService
 */
let SpinnerService = class SpinnerService {
    constructor() {
        this.activeSpinners = new Map();
        this.activeSpinnersSubject = new rxjs_1.Subject();
    }
    getActiveSpinnersObservable() {
        return this.activeSpinnersSubject.asObservable();
    }
    getActiveSpinners() {
        return Array.from(this.activeSpinners).map(entry => entry[1]);
    }
    setSpinner(id, spinner) {
        if (typeof spinner.divCount === "undefined") {
            spinner.divCount = spinner_consts_1.spinnerDivCounts[spinner.icon.toString()];
        }
        this.activeSpinners.set(id, spinner);
        this.activeSpinnersSubject.next(this.getActiveSpinners());
    }
    updateSpinner(id, spinner) {
        const spinnerToUpdate = this.activeSpinners.get(id);
        if (typeof spinnerToUpdate === "undefined") {
            return false;
        }
        this.activeSpinners.set(id, Object.assign(spinnerToUpdate, spinner));
        return true;
    }
    removeSpinner(id) {
        this.activeSpinners.delete(id);
        this.activeSpinnersSubject.next(this.getActiveSpinners());
    }
    removeSpinnersStartWith(match) {
        const toDelete = new Set();
        this.activeSpinners.forEach((spinner, key) => {
            if (key.startsWith(match)) {
                toDelete.add(key);
            }
        });
        toDelete.forEach(key => this.activeSpinners.delete(key));
    }
};
SpinnerService = __decorate([
    core_1.Injectable({
        providedIn: "root",
    }),
    __metadata("design:paramtypes", [])
], SpinnerService);
exports.SpinnerService = SpinnerService;


/***/ }),

/***/ "./src/app/spinner/spinner.component.html":
/*!************************************************!*\
  !*** ./src/app/spinner/spinner.component.html ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<!-- Adapted from ngx-spinner package -->\n<div\n  [ngClass]=\"{\n    'spinners-overlay': fullScreenOverlay,\n    'spinners-visible': showSpinners\n  }\"\n  [ngStyle]=\"{ 'z-index': zIndex ? zIndex : '' }\"\n>\n  <div [ngClass]=\"{ 'spinners-overlay-container': fullScreenOverlay }\">\n    <div\n      [class]=\"'spinner-icon ' + spinnerIconClass + ' ' + spinnerIconSize\"\n      [ngStyle]=\"{ color: color }\"\n    >\n      <div *ngFor=\"let i of spinnerIconDivArray\"></div>\n    </div>\n\n    <div class=\"spinners-container\">\n      <div class=\"spinner\" *ngFor=\"let spinner of activeSpinners\">\n        <div\n          class=\"loading-text text-overflow-ellipsis\"\n          [ngStyle]=\"{ color: color }\"\n          *ngIf=\"spinner.name !== ''\"\n        >\n          {{ spinner.name }}\n        </div>\n\n        <p-progressBar\n          styleClass=\"spinner-progressbar\"\n          [ngStyle]=\"{ 'background-color': color + ' !important' }\"\n          [value]=\"spinner.progress\"\n          *ngIf=\"spinner.progress !== undefined\"\n        ></p-progressBar>\n      </div>\n    </div>\n  </div>\n</div>\n"

/***/ }),

/***/ "./src/app/spinner/spinner.component.scss":
/*!************************************************!*\
  !*** ./src/app/spinner/spinner.component.scss ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "div.spinners-overlay {\n  touch-action: none;\n  pointer-events: none;\n  height: -webkit-fit-content;\n  height: -moz-fit-content;\n  height: fit-content;\n  width: -webkit-fit-content;\n  width: -moz-fit-content;\n  width: fit-content;\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  background: rgba(0, 0, 0, 0.25);\n  z-index: 1200;\n  transition: opacity linear 0.2s;\n  padding: 30px 20px 10px 20px;\n  border-radius: 4px;\n  transform: translate(-50%, -50%);\n  min-height: 160px;\n  opacity: 0; }\n\ndiv.spinners-overlay.spinners-visible {\n  opacity: 1;\n  pointer-events: auto;\n  touch-action: auto; }\n\n.spinners-container {\n  padding: 0 20px;\n  overflow-y: auto;\n  overflow-y: overlay;\n  -ms-overflow-style: -ms-autohiding-scrollbar;\n  pointer-events: auto;\n  margin-top: 10px;\n  width: 400px;\n  max-height: calc(100vh - 250px); }\n\n.spinner-progressbar {\n  width: 50vw;\n  max-width: 370px;\n  background-color: #ffffff56 !important; }\n\n.spinner-progressbar.ui-progressbar .ui-progressbar-value {\n  background: #ffffff !important; }\n\n.spinner {\n  padding: 5px 0; }\n\n.loading-text {\n  color: white;\n  text-align: center;\n  padding: 10px; }\n\n.spinner-icon {\n  margin: auto; }\n\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9wYXdhbm1hY2Jvb2svRG9jdW1lbnRzL2Rzcy9jbGllbnQvc3JjL2FwcC9zcGlubmVyL3NwaW5uZXIuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFDRSxrQkFBa0I7RUFDbEIsb0JBQW9CO0VBQ3BCLDJCQUFtQjtFQUFuQix3QkFBbUI7RUFBbkIsbUJBQW1CO0VBQ25CLDBCQUFrQjtFQUFsQix1QkFBa0I7RUFBbEIsa0JBQWtCO0VBQ2xCLGtCQUFrQjtFQUNsQixRQUFRO0VBQ1IsU0FBUztFQUNULCtCQUErQjtFQUMvQixhQUFhO0VBQ2IsK0JBQStCO0VBQy9CLDRCQUE0QjtFQUM1QixrQkFBa0I7RUFDbEIsZ0NBQWdDO0VBQ2hDLGlCQUFpQjtFQUNqQixVQUFVLEVBQUE7O0FBR1o7RUFDRSxVQUFVO0VBQ1Ysb0JBQW9CO0VBQ3BCLGtCQUFrQixFQUFBOztBQUlwQjtFQUNFLGVBQWU7RUFDZixnQkFBZ0I7RUFDaEIsbUJBQW1CO0VBQ25CLDRDQUE0QztFQUM1QyxvQkFBb0I7RUFDcEIsZ0JBQWdCO0VBQ2hCLFlBQVk7RUFDWiwrQkFBK0IsRUFBQTs7QUFHakM7RUFDRSxXQUFXO0VBQ1gsZ0JBQWdCO0VBRWhCLHNDQUFzQyxFQUFBOztBQUd4QztFQUNFLDhCQUE4QixFQUFBOztBQUdoQztFQUNFLGNBQWMsRUFBQTs7QUFHaEI7RUFDRSxZQUFZO0VBQ1osa0JBQWtCO0VBQ2xCLGFBQWEsRUFBQTs7QUFHZjtFQUNFLFlBQVksRUFBQSIsImZpbGUiOiJzcmMvYXBwL3NwaW5uZXIvc3Bpbm5lci5jb21wb25lbnQuc2NzcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIE92ZXJyaWRlIG5neC1zcGlubmVyIHN0eWxlc1xuZGl2LnNwaW5uZXJzLW92ZXJsYXkge1xuICB0b3VjaC1hY3Rpb246IG5vbmU7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICBoZWlnaHQ6IGZpdC1jb250ZW50O1xuICB3aWR0aDogZml0LWNvbnRlbnQ7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgdG9wOiA1MCU7XG4gIGxlZnQ6IDUwJTtcbiAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjI1KTtcbiAgei1pbmRleDogMTIwMDtcbiAgdHJhbnNpdGlvbjogb3BhY2l0eSBsaW5lYXIgMC4ycztcbiAgcGFkZGluZzogMzBweCAyMHB4IDEwcHggMjBweDtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLCAtNTAlKTtcbiAgbWluLWhlaWdodDogMTYwcHg7XG4gIG9wYWNpdHk6IDA7XG59XG5cbmRpdi5zcGlubmVycy1vdmVybGF5LnNwaW5uZXJzLXZpc2libGUge1xuICBvcGFjaXR5OiAxO1xuICBwb2ludGVyLWV2ZW50czogYXV0bztcbiAgdG91Y2gtYWN0aW9uOiBhdXRvO1xufVxuXG4vLyBDb250YWluZXIgY29udGFpbmluZyBzcGlubmVyIG5hbWUgKyBwcm9ncmVzcyBiYXIgKGRvZXMgTk9UIGNvbnRhaW4gc3Bpbm5lciBpY29uKVxuLnNwaW5uZXJzLWNvbnRhaW5lciB7XG4gIHBhZGRpbmc6IDAgMjBweDtcbiAgb3ZlcmZsb3cteTogYXV0bztcbiAgb3ZlcmZsb3cteTogb3ZlcmxheTtcbiAgLW1zLW92ZXJmbG93LXN0eWxlOiAtbXMtYXV0b2hpZGluZy1zY3JvbGxiYXI7XG4gIHBvaW50ZXItZXZlbnRzOiBhdXRvO1xuICBtYXJnaW4tdG9wOiAxMHB4O1xuICB3aWR0aDogNDAwcHg7XG4gIG1heC1oZWlnaHQ6IGNhbGMoMTAwdmggLSAyNTBweCk7XG59XG5cbi5zcGlubmVyLXByb2dyZXNzYmFyIHtcbiAgd2lkdGg6IDUwdnc7XG4gIG1heC13aWR0aDogMzcwcHg7XG5cbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZmZmZjU2ICFpbXBvcnRhbnQ7XG59XG5cbi5zcGlubmVyLXByb2dyZXNzYmFyLnVpLXByb2dyZXNzYmFyIC51aS1wcm9ncmVzc2Jhci12YWx1ZSB7XG4gIGJhY2tncm91bmQ6ICNmZmZmZmYgIWltcG9ydGFudDtcbn1cblxuLnNwaW5uZXIge1xuICBwYWRkaW5nOiA1cHggMDtcbn1cblxuLmxvYWRpbmctdGV4dCB7XG4gIGNvbG9yOiB3aGl0ZTtcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xuICBwYWRkaW5nOiAxMHB4O1xufVxuXG4uc3Bpbm5lci1pY29uIHtcbiAgbWFyZ2luOiBhdXRvO1xufVxuIl19 */"

/***/ }),

/***/ "./src/app/spinner/spinner.component.ts":
/*!**********************************************!*\
  !*** ./src/app/spinner/spinner.component.ts ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const spinner_service_service_1 = __webpack_require__(/*! ./spinner-service.service */ "./src/app/spinner/spinner-service.service.ts");
/**
 * Handles display spinners (loading/progress bars). Listens for changes from SpinnerService
 *
 * @export
 * @class SpinnerComponent
 */
let SpinnerComponent = class SpinnerComponent {
    constructor(spinnerService, cdr) {
        this.spinnerService = spinnerService;
        this.cdr = cdr;
        this.fullScreenOverlay = false;
        this.defaultIconSize = spinner_service_service_1.SpinnerSize.lg;
        this.spinnerIconClass = "";
        this.spinnerIconSize = this.defaultIconSize;
        this.spinnerIconDivArray = [];
        this.activeSpinners = [];
        this.showSpinners = false;
    }
    ngOnInit() {
        if (typeof this.color === "undefined") {
            this.color = this.fullScreenOverlay ? "#ffffff" : "#333333";
        }
        this.updateSpinners(this.spinnerService.getActiveSpinners());
        // Update active spinner array from SpinnerService active spinner map
        this.spinnerSubscription = this.spinnerService
            .getActiveSpinnersObservable()
            .subscribe(spinners => this.updateSpinners(spinners));
    }
    updateSpinners(spinners) {
        this.activeSpinners = spinners
            // Only show spinners which match the 'target' input
            .filter(spinner => (typeof this.spinnerTarget === "undefined" &&
            typeof spinner.target === "undefined") ||
            this.spinnerTarget === spinner.target);
        // Set spinner icon to the FIRST spinner
        if (this.activeSpinners.length > 0) {
            this.spinnerIconClass = this.activeSpinners[0].icon;
            this.spinnerIconSize =
                "size" in this.activeSpinners[0]
                    ? this.activeSpinners[0].size
                    : this.defaultIconSize;
            this.spinnerIconDivArray = Array(this.activeSpinners[0].divCount)
                .fill(0)
                .map((x, i) => i);
            this.showSpinners = true;
        }
        else {
            this.spinnerIconClass = "";
            this.showSpinners = false;
        }
        // This is needed to force propagate changes to the view
        this.cdr.detectChanges();
    }
    ngOnDestroy() {
        if (typeof this.spinnerSubscription !== "undefined") {
            this.spinnerSubscription.unsubscribe();
        }
    }
};
__decorate([
    core_1.Input(),
    __metadata("design:type", String)
], SpinnerComponent.prototype, "zIndex", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Object)
], SpinnerComponent.prototype, "fullScreenOverlay", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", String)
], SpinnerComponent.prototype, "color", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", String)
], SpinnerComponent.prototype, "spinnerTarget", void 0);
SpinnerComponent = __decorate([
    core_1.Component({
        selector: "app-spinner",
        template: __webpack_require__(/*! ./spinner.component.html */ "./src/app/spinner/spinner.component.html"),
        encapsulation: core_1.ViewEncapsulation.None,
        styles: [__webpack_require__(/*! ./spinner.component.scss */ "./src/app/spinner/spinner.component.scss")]
    }),
    __metadata("design:paramtypes", [spinner_service_service_1.SpinnerService,
        core_1.ChangeDetectorRef])
], SpinnerComponent);
exports.SpinnerComponent = SpinnerComponent;


/***/ }),

/***/ "./src/app/util/callback.pipe.ts":
/*!***************************************!*\
  !*** ./src/app/util/callback.pipe.ts ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// From https://stackoverflow.com/a/43310428
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
let CallbackPipe = class CallbackPipe {
    transform(items, callback) {
        if (!items || !callback) {
            return items;
        }
        return items.filter(item => callback(item));
    }
};
CallbackPipe = __decorate([
    core_1.Pipe({
        name: "callback",
        pure: false,
    })
], CallbackPipe);
exports.CallbackPipe = CallbackPipe;


/***/ }),

/***/ "./src/app/util/download-file.ts":
/*!***************************************!*\
  !*** ./src/app/util/download-file.ts ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// Adapted from https://stackoverflow.com/a/33542499
function downloadFile(filename, data, type = "text/plain") {
    const blob = new Blob([data], { type });
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else {
        const elem = window.document.createElement("a");
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
        // TODO: should window.URL.revokeObjectURL(blob):
    }
}
exports.downloadFile = downloadFile;


/***/ }),

/***/ "./src/app/util/form-validators.ts":
/*!*****************************************!*\
  !*** ./src/app/util/form-validators.ts ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var ForbiddenValidatorDirective_1;
const forms_1 = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm2015/forms.js");
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
function validateCustomValidator(customValidator) {
    return (control) => {
        if (control.value === null || customValidator.isValid(control.value)) {
            return null; // don't validate empty values to allow optional controls
        }
        return { customValidator: true };
    };
}
exports.validateCustomValidator = validateCustomValidator;
let ForbiddenValidatorDirective = ForbiddenValidatorDirective_1 = class ForbiddenValidatorDirective {
    validate(control) {
        if (control.value === null || this.customValidator.isValid(control.value)) {
            return null; // don't validate empty values to allow optional controls
        }
        return { customValidator: true };
    }
};
__decorate([
    core_1.Input(),
    __metadata("design:type", Object)
], ForbiddenValidatorDirective.prototype, "customValidator", void 0);
ForbiddenValidatorDirective = ForbiddenValidatorDirective_1 = __decorate([
    core_1.Directive({
        selector: "[customValidator]",
        providers: [
            {
                provide: forms_1.NG_VALIDATORS,
                useExisting: ForbiddenValidatorDirective_1,
                multi: true,
            },
        ],
    })
], ForbiddenValidatorDirective);
exports.ForbiddenValidatorDirective = ForbiddenValidatorDirective;


/***/ }),

/***/ "./src/app/util/keypress.ts":
/*!**********************************!*\
  !*** ./src/app/util/keypress.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function onKeypress(evt, key, fn, ...args) {
    if (evt.key === key) {
        fn(...args);
    }
}
exports.onKeypress = onKeypress;


/***/ }),

/***/ "./src/app/util/web-workers/web-worker.ts":
/*!************************************************!*\
  !*** ./src/app/util/web-workers/web-worker.ts ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var WebWorkerType;
(function (WebWorkerType) {
    WebWorkerType["GeotiffLoader"] = "assets/scripts/geotiff-web-workerV2.js";
})(WebWorkerType = exports.WebWorkerType || (exports.WebWorkerType = {}));
var WebWorkerErrorMessages;
(function (WebWorkerErrorMessages) {
    WebWorkerErrorMessages["WorkerTerminated"] = "WebWorker terminated";
})(WebWorkerErrorMessages = exports.WebWorkerErrorMessages || (exports.WebWorkerErrorMessages = {}));
// TODO: Maybe add some queueing?
/**
 * Note: currently not used
 *
 * @export
 * @class WebWorker
 */
class WebWorker {
    constructor(type) {
        this.workerPromises = new Map();
        this.type = type;
        this.worker = new Worker(type);
        this.worker.onmessage = this.onMessageReceived.bind(this);
        this.worker.onerror = this.onError.bind(this);
    }
    onMessageReceived(message) {
        if (typeof message.data.args !== "undefined" &&
            this.workerPromises.has(message.data.args.key)) {
            if ("error" in message.data) {
                this.workerPromises
                    .get(message.data.args.key)
                    .reject(message.data.error);
            }
            else {
                this.workerPromises.get(message.data.args.key).resolve(message.data);
            }
        }
        else {
            console.log(`Webworker ${this.type} received message: ${message.data}`);
        }
    }
    onError(message) {
        console.log(message);
        this.workerPromises.forEach(p => p.reject(message.data));
    }
    run(args) {
        return new Promise((resolve, reject) => {
            this.workerPromises.set(args.key, { resolve, reject });
            this.worker.postMessage(args);
        });
    }
    terminate() {
        this.workerPromises.forEach(p => p.reject(WebWorkerErrorMessages.WorkerTerminated));
        this.worker.terminate();
    }
}
exports.WebWorker = WebWorker;


/***/ }),

/***/ "./src/environments/environment.ts":
/*!*****************************************!*\
  !*** ./src/environments/environment.ts ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
exports.environment = {
    production: false,
};
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
__webpack_require__(/*! core-js/es7/reflect */ "./node_modules/core-js/es7/reflect.js");
const core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm2015/core.js");
const platform_browser_dynamic_1 = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm2015/platform-browser-dynamic.js");
const app_module_1 = __webpack_require__(/*! ./app/app.module */ "./src/app/app.module.ts");
const environment_1 = __webpack_require__(/*! ./environments/environment */ "./src/environments/environment.ts");
if (environment_1.environment.production) {
    core_1.enableProdMode();
}
platform_browser_dynamic_1.platformBrowserDynamic()
    .bootstrapModule(app_module_1.AppModule)
    .catch(err => console.error(err));


/***/ }),

/***/ 0:
/*!***************************!*\
  !*** multi ./src/main.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /Users/pawanmacbook/Documents/dss/client/src/main.ts */"./src/main.ts");


/***/ }),

/***/ 1:
/*!**************************************!*\
  !*** ./require-utils.node (ignored) ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),

/***/ 2:
/*!************************************************!*\
  !*** ../../node/read-file-sync.node (ignored) ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),

/***/ 3:
/*!********************************************!*\
  !*** ../../node/write-file.node (ignored) ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),

/***/ 4:
/*!****************************************************!*\
  !*** ../node/utils/to-array-buffer.node (ignored) ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),

/***/ 5:
/*!*******************************!*\
  !*** asciify-image (ignored) ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),

/***/ 6:
/*!********************!*\
  !*** fs (ignored) ***!
  \********************/
/*! no static exports found */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),

/***/ 7:
/*!**********************!*\
  !*** path (ignored) ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

/* (ignored) */

/***/ })

},[[0,"runtime","vendor"]]]);
//# sourceMappingURL=main.js.map