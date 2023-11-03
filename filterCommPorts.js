"use strict";

function initializeScript()
{
    return [new host.functionAlias(GetHandlesToDevice, "DeviceFileHandles"),
			new host.functionAlias(GetQueuedIrpsForPort, "IrpsForPort"),
			new host.functionAlias(RegisteredFilterDrivers, "RegisteredFilters"),
			new host.functionAlias(EnumCommPortListForFilter, "EnumCommPortListForFilter"),
	        new host.functionAlias(EnumServerPortsForFilter, "EnumServerPortsForFilter"),
			new host.functionAlias(AllServerPorts, "AllServerPorts"),
			new host.apiVersionSupport(1, 6)];
}

function GetHandlesToDevice(Device)
{
    // Get easy access to the debug output method
    let dbgOutput = host.diagnostics.debugLog;

    // Loop over each process
    let processes = host.currentSession.Processes;
	let objHeaderType = host.getModuleType("nt", "_OBJECT_HEADER");
	let objHeaderOffset = objHeaderType.fields.Body.offset;
 
    for (let process of processes)
    { 
        let handles = process.Io.Handles;
 
        try {
 
            for (let handle of handles) {
 
                try {
 
                    let fileObj = handle.Object.ObjectType;
                    if (fileObj === "File") {
						if (host.parseInt64(handle.Object.UnderlyingObject.DeviceObject.address, 16).compareTo(Device) == 0)
                        {
							let fscontext2 = handle.Object.UnderlyingObject.FsContext2.address;
							let fltCcbType = host.getModuleType("FltMgr", "_FLT_CCB");
							let port = host.createTypedObject(fscontext2, fltCcbType).Data.Port.Port;
							let portObjHeader = host.createTypedObject(port.ServerPort.address.subtract(objHeaderOffset), objHeaderType);
							dbgOutput("\tProcess ", process.Name, " has handle ", handle.Handle, " to port ", portObjHeader.ObjectName, "\n");
							
                        }
                    }
                   
                } catch (e) {
 
                    dbgOutput("\tException parsing handle ", handle.Handle, "in process ", process.Name, "!\n");
 
                }
 
            }
 
        } catch (e) {
 
           // dbgOutput("\tException parsing handle table for process ", process.Name, " PID ", process.Id, "!\n");
 
        }
 
    }

}

function GetQueuedIrpsForPort(Port)
{
	let dbgOutput = host.diagnostics.debugLog;
	let v_port = host.createTypedObject(Port.address, host.getModuleType("FltMgr", "_FLT_PORT_OBJECT"));
	dbgOutput("Port: ", v_port.address, "\n");
	let waiterlist = host.namespace.Debugger.Utility.Collections.FromListEntry(v_port.MsgQ.WaiterQ.mList, "nt!_IRP", "Tail.Overlay.ListEntry");
	
	for (let entry of waiterlist) {
		dbgOutput("\tIRP address: ", entry.address, " by thread ", entry.CurrentThread.Cid.UniqueThread.address,"\n");
	}
}

function RegisteredFilterDrivers()
{
	let dbgOutput = host.diagnostics.debugLog;
	let fltglobals = host.getModuleSymbolAddress("fltmgr", "FltGlobals");
	let typedFltGlobals = host.createTypedObject(fltglobals, "fltmgr", "_GLOBALS");
	
	dbgOutput("Flt Globals: ", typedFltGlobals.address, "\n");
	
	let flt_frames = host.namespace.Debugger.Utility.Collections.FromListEntry(typedFltGlobals.FrameList.rList, "fltmgr!_FLTP_FRAME", "Links");
	
	for (let flt_frame of flt_frames) {
		dbgOutput("Frame ", flt_frame.FrameID, "\n");
		
		let filters = host.namespace.Debugger.Utility.Collections.FromListEntry(flt_frame.RegisteredFilters.rList, "fltmgr!_FLT_FILTER", "Base.PrimaryLink");
		
		for (let filter of filters) {
			dbgOutput("\tFilter ", filter.Name, " : ", filter.address, "\n");
			
			let instances = host.namespace.Debugger.Utility.Collections.FromListEntry(filter.InstanceList.rList, "fltmgr!_FLT_INSTANCE", "FilterLink");
			for (let instance of instances) {
				dbgOutput("\t\tInstance: ", instance.address, ", Name: ", instance.Name, ", Altitude: ", instance.Altitude, "\n");
			}

		}
	}
}

function EnumCommPortListForFilter(Filter)
{
	let dbgOutput = host.diagnostics.debugLog;
	let v_filter = host.createTypedObject(Filter, host.getModuleType("FltMgr", "_FLT_FILTER"));
	dbgOutput("Filter: ", v_filter.address, "\n");

	if (v_filter.PortList.mCount != 0) {
		let ports = host.namespace.Debugger.Utility.Collections.FromListEntry(v_filter.PortList.mList, "fltmgr!_FLT_PORT_OBJECT", "FilterLink");

		for (let port of ports) {
			if (port != 0) {
				dbgOutput("Port: ", port.address, "\n");
				dbgOutput("\tServerPort: ", port.ServerPort.address, "\n");
				dbgOutput("\t\tConnectNotify: ", port.ServerPort.ConnectNotify.address, "\n");
				dbgOutput("\t\tDisconnectNotify: ", port.ServerPort.DisconnectNotify.address, "\n");
				dbgOutput("\t\tMessageNotify: ", port.ServerPort.MessageNotify.address, "\n");
				dbgOutput("\t\tNumberOfConnections: ", port.ServerPort.NumberOfConnections, "\n");
				dbgOutput("\t\tMaxConnections: ", port.ServerPort.MaxConnections, "\n");
				dbgOutput("\tMsgQ: ", port.MsgQ.address, "\n");
				dbgOutput("\tDisconnected: ", port.Disconnected, "\n");
			}
		}
	}	
}

function EnumServerPortsForFilter(Filter)
{
	let dbgOutput = host.diagnostics.debugLog;
	let v_filter = host.createTypedObject(Filter, host.getModuleType("FltMgr", "_FLT_FILTER"));

	if (v_filter.ConnectionList.mCount != 0)
	{
		let ports = host.namespace.Debugger.Utility.Collections.FromListEntry(v_filter.ConnectionList.mList, "fltmgr!_FLT_SERVER_PORT_OBJECT", "FilterLink");

		for (let port of ports) {
			let objectHeaderAddress = host.parseInt64(port.address, 16).subtract(0x30);
			let objectHeader = host.createTypedObject(objectHeaderAddress, host.getModuleType("nt", "_OBJECT_HEADER"));
			
			dbgOutput("\tServerPort ", objectHeader.ObjectName, ": ", port.address, "\n");
			dbgOutput("\t\tConnectNotify: ", port.ConnectNotify.address, "\n");
			dbgOutput("\t\tDisconnectNotify: ", port.DisconnectNotify.address, "\n");
			dbgOutput("\t\tMessageNotify: ", port.MessageNotify.address, "\n");
			dbgOutput("\t\tNumberOfConnections: ", port.NumberOfConnections, "\n");
			dbgOutput("\t\tMaxConnections: ", port.MaxConnections, "\n");
		}
	}
}

function AllServerPorts()
{
	let dbgOutput = host.diagnostics.debugLog;
	let fltglobals = host.getModuleSymbolAddress("fltmgr", "FltGlobals");
	let typedFltGlobals = host.createTypedObject(fltglobals, "fltmgr", "_GLOBALS");
	let flt_frames = host.namespace.Debugger.Utility.Collections.FromListEntry(typedFltGlobals.FrameList.rList, "fltmgr!_FLTP_FRAME", "Links");
	
	for (let flt_frame of flt_frames) {
		dbgOutput("Frame ", flt_frame.FrameID, "\n");
		
		let filters = host.namespace.Debugger.Utility.Collections.FromListEntry(flt_frame.RegisteredFilters.rList, "fltmgr!_FLT_FILTER", "Base.PrimaryLink");
		
		for (let filter of filters) {
			dbgOutput("Filter ", filter.Name, " : ", filter.address, "\n");
			EnumServerPortsForFilter(filter.address);
			dbgOutput("\n");
		}
	}
}
