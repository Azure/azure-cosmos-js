
import * as url from "url";
import { Constants } from "./common";

/**
 * This internal class implements the logic for endpoint management for geo-replicated database accounts.
 * @property {object} client                       - The document client instance.
 * @property {string} defaultEndpoint              - The endpoint used to create the client instance.
 * @property {bool} enableEndpointDiscovery        - Flag to enable/disable automatic redirecting of requests
 *                                                   based on read/write operations.
 * @property {Array} preferredLocations            - List of azure regions to be used as preferred locations
 *                                                   for read requests.
 * @property {bool} isEndpointCacheInitialized     - Flag to determine whether the endpoint cache is initialized or not.
 */
export class GlobalEndpointManager {
    private client: any; // TODO: any documentclient
    private defaultEndpoint: string;
    private readEndpoint: string;
    private writeEndpoint: string;
    public enableEndpointDiscovery: boolean;
    private preferredLocations: string[];
    private isEndpointCacheInitialized: boolean;

    /**
     * @constructor GlobalEndpointManager
     * @param {object} client                          - The document client instance.
     */
    constructor(client: any) { // TODO: any documentclient
        this.client = client;
        this.defaultEndpoint = client.urlConnection;
        this.readEndpoint = client.urlConnection;
        this.writeEndpoint = client.urlConnection;
        this.enableEndpointDiscovery = client.connectionPolicy.EnableEndpointDiscovery;
        this.preferredLocations = client.connectionPolicy.PreferredLocations;
        this.isEndpointCacheInitialized = false;
    }
    /** Gets the current read endpoint from the endpoint cache.
     * @memberof GlobalEndpointManager
     * @instance
     * @param {function} callback        - The callback function which takes readEndpoint(string) as an argument.
     */
    public getReadEndpoint(callback) {
        if (!this.isEndpointCacheInitialized) {
            this.refreshEndpointList(function (writeEndpoint, readEndpoint) {
                callback(readEndpoint);
            });
        } else {
            callback(this.readEndpoint);
        }
    }

    /** Sets the current read endpoint.
     * @memberof GlobalEndpointManager
     * @instance
     * @param {string} readEndpoint        - The endpoint to be set as readEndpoint.
     */
    public setReadEndpoint(readEndpoint) {
        this.readEndpoint = readEndpoint;
    }

    /** Gets the current write endpoint from the endpoint cache.
     * @memberof GlobalEndpointManager
     * @instance
     * @param {function} callback        - The callback function which takes writeEndpoint(string) as an argument.
     */
    public getWriteEndpoint(callback) {
        if (!this.isEndpointCacheInitialized) {
            this.refreshEndpointList(function (writeEndpoint, readEndpoint) {
                callback(writeEndpoint);
            });
        } else {
            callback(this.writeEndpoint);
        }
    }

    /** Sets the current write endpoint.
     * @memberof GlobalEndpointManager
     * @instance
     * @param {string} writeEndpoint        - The endpoint to be set as writeEndpoint.
     */
    public setWriteEndpoint(writeEndpoint) {
        this.writeEndpoint = writeEndpoint;
    }

    /** Refreshes the endpoint list by retrieving the writable and readable locations
        from the geo-replicated database account and then updating the locations cache.
        We skip the refreshing if EnableEndpointDiscovery is set to False
     * @memberof GlobalEndpointManager
     * @instance
     * @param {function} callback        - The callback function which takes writeEndpoint(string) and readEndpoint(string) as arguments.
    */
    public refreshEndpointList(callback) {
        var writableLocations = [];
        var readableLocations = [];
        var databaseAccount;

        var that = this;
        if (this.enableEndpointDiscovery) {
            this._getDatabaseAccount(function (databaseAccount) {
                if (databaseAccount) {
                    writableLocations = databaseAccount.WritableLocations;
                    readableLocations = databaseAccount.ReadableLocations;
                }

                // Read and Write endpoints will be initialized to default endpoint if we were not able to get the database account info
                that._updateLocationsCache(writableLocations, readableLocations, function (endpoints) {
                    that.writeEndpoint = endpoints[0];
                    that.readEndpoint = endpoints[1];
                    that.isEndpointCacheInitialized = true;
                    callback(that.writeEndpoint, that.readEndpoint);
                });
            });
        } else {
            callback(that.writeEndpoint, that.readEndpoint);
        }
    }

    /** Gets the database account first by using the default endpoint, and if that doesn't returns
       use the endpoints for the preferred locations in the order they are specified to get 
       the database account.
     * @memberof GlobalEndpointManager
     * @instance
     * @param {function} callback        - The callback function which takes databaseAccount(object) as an argument.
     */
    private _getDatabaseAccount(callback) {
        var that = this;
        var options = { urlConnection: this.defaultEndpoint };
        this.client.getDatabaseAccount(options, function (err, databaseAccount) {
            // If for any reason(non - globaldb related), we are not able to get the database account from the above call to getDatabaseAccount,
            // we would try to get this information from any of the preferred locations that the user might have specified(by creating a locational endpoint)
            // and keeping eating the exception until we get the database account and return None at the end, if we are not able to get that info from any endpoints

            if (err) {
                var func = function (defaultEndpoint, preferredLocations, index) {
                    if (index < preferredLocations.length) {
                        var locationalEndpoint = that._getLocationalEndpoint(defaultEndpoint, preferredLocations[index]);
                        var options = { urlConnection: locationalEndpoint };
                        that.client.getDatabaseAccount(options, function (err, databaseAccount) {
                            if (err) {
                                func(defaultEndpoint, preferredLocations, index + 1);
                            } else {
                                return callback(databaseAccount);
                            }
                        });
                    } else {
                        return callback(null);
                    }
                }
                func(that.defaultEndpoint, that.preferredLocations, 0);

            } else {
                return callback(databaseAccount);
            }
        });
    }

    /** Gets the locational endpoint using the location name passed to it using the default endpoint.
     * @memberof GlobalEndpointManager
     * @instance
     * @param {string} defaultEndpoint - The default endpoint to use for teh endpoint.
     * @param {string} locationName    - The location name for the azure region like "East US".
     */
    private static _getLocationalEndpoint(defaultEndpoint, locationName) {
        // For defaultEndpoint like 'https://contoso.documents.azure.com:443/' parse it to generate URL format
        // This defaultEndpoint should be global endpoint(and cannot be a locational endpoint) and we agreed to document that
        var endpointUrl = url.parse(defaultEndpoint, true, true);

        // hostname attribute in endpointUrl will return 'contoso.documents.azure.com'
        if (endpointUrl.hostname) {
            var hostnameParts = (endpointUrl.hostname).toString().toLowerCase().split(".");
            if (hostnameParts) {
                // globalDatabaseAccountName will return 'contoso'
                var globalDatabaseAccountName = hostnameParts[0];

                // Prepare the locationalDatabaseAccountName as contoso-EastUS for location_name 'East US'
                var locationalDatabaseAccountName = globalDatabaseAccountName + "-" + locationName.replace(" ", "");

                // Replace 'contoso' with 'contoso-EastUS' and return locationalEndpoint as https://contoso-EastUS.documents.azure.com:443/
                var locationalEndpoint = defaultEndpoint.toLowerCase().replace(globalDatabaseAccountName, locationalDatabaseAccountName);
                return locationalEndpoint;
            }
        }

        return null;
    }

    /** Updates the read and write endpoints from the passed-in readable and writable locations.
     * @memberof GlobalEndpointManager
     * @instance
     * @param {Array} writableLocations     - The list of writable locations for the geo-enabled database account.
     * @param {Array} readableLocations     - The list of readable locations for the geo-enabled database account.
     * @param {function} callback           - The function to be called as callback after executing this method.
     */
    private _updateLocationsCache(writableLocations, readableLocations, callback) {
        var writeEndpoint;
        var readEndpoint;
        // Use the default endpoint as Read and Write endpoints if EnableEndpointDiscovery
        // is set to False.
        if (!this.enableEndpointDiscovery) {
            writeEndpoint = this.defaultEndpoint;
            readEndpoint = this.defaultEndpoint;
            return callback([writeEndpoint, readEndpoint]);
        }

        // Use the default endpoint as Write endpoint if there are no writable locations, or
        // first writable location as Write endpoint if there are writable locations
        if (writableLocations.length === 0) {
            writeEndpoint = this.defaultEndpoint;
        } else {
            writeEndpoint = writableLocations[0][Constants.DatabaseAccountEndpoint];
        }

        // Use the Write endpoint as Read endpoint if there are no readable locations
        if (readableLocations.length === 0) {
            readEndpoint = writeEndpoint;
            return callback([writeEndpoint, readEndpoint]);
        } else {
            // Use the writable location as Read endpoint if there are no preferred locations or
            // none of the preferred locations are in read or write locations
            readEndpoint = writeEndpoint;

            if (!this.preferredLocations) {
                return callback([writeEndpoint, readEndpoint]);
            }

            for (var i = 0; i < this.preferredLocations.length; i++) {
                var preferredLocation = this.preferredLocations[i];
                // Use the first readable location as Read endpoint from the preferred locations
                for (var j = 0; j < readableLocations.length; j++) {
                    var readLocation = readableLocations[j];
                    if (readLocation[Constants.Name] === preferredLocation) {
                        readEndpoint = readLocation[Constants.DatabaseAccountEndpoint];
                        return callback([writeEndpoint, readEndpoint]);
                    }
                }
                // Else, use the first writable location as Read endpoint from the preferred locations
                for (var k = 0; k < writableLocations.length; k++) {
                    var writeLocation = writableLocations[k];
                    if (writeLocation[Constants.Name] === preferredLocation) {
                        readEndpoint = writeLocation[Constants.DatabaseAccountEndpoint];
                        return callback([writeEndpoint, readEndpoint]);
                    }
                }
            }

            return callback([writeEndpoint, readEndpoint]);
        }
    }
}
