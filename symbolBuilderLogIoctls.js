"use strict";

//
// To use the script:
// 1. Load SymbolBuilderComposition (clone and build from: https://github.com/microsoft/WinDbg-Samples/blob/master/TargetComposition/SymBuilder/Readme.txt)
// 2. Fix function offset and size as needed in DefineNtDeviceIoControlFileSignature (current offset and size match 24H2 Preview build 10.026080.1)
// 3. Call DefineNtDeviceIoControlFileSignature with: dx @$DefineNtDeviceIoControlFileSignature()
// 4. Reload symbols: .reload
// 5. Define breakpoint on NtDeviceIoControlFile: bp nt!NtDeviceIoControlFile "dx @$LogIoctlArgs(); g"
// 6. Define breakpoint on end of NtDeviceIoControlFile: bp nt!NtDeviceIoControlFile+0x62 "dx @$LogIoctlOutput(); g"
// 7. Let the machine run with "g"
// 8. When you'd like to stop the trace and flush data to the file, call CloseLogFile: dx @$CloseLogFile()
//

function initializeScript()
{
    return [new host.apiVersionSupport(1, 9),
            new host.functionAlias(CreateTextWriter, "CreateTextWriter"),
            new host.functionAlias(CloseLogFile, "CloseLogFile"),
            new host.functionAlias(DefineNtDeviceIoControlFileSignature, "DefineNtDeviceIoControlFileSignature"),
            new host.functionAlias(LogIoctlArgs, "LogIoctlArgs"),
            new host.functionAlias(LogIoctlOutput, "LogIoctlOutput")];
}

function invokeScript()
{
}

let sym = 0;
let lastOutputBuffer = 0;
let lastOutputBufferLength = 0;
let logFile = 0;
let txtWriter = 0;


function CreateTextWriter(f)
{
    return host.namespace.Debugger.Utility.FileSystem.CreateTextWriter(f);
}

function CloseLogFile()
{
    if (logFile != 0)
    {
        logFile.Close();
        logFile = 0;
        txtWriter = 0;
    }
}

let filename = "c:\\temp\\ioctl_args.txt";

function LogIoctlOutput()
{
    let dbgOutput = host.diagnostics.debugLog;

    if ((logFile === 0) || (txtWriter === 0))
    {
        if (host.namespace.Debugger.Utility.FileSystem.FileExists(filename))
        {
            logFile = host.namespace.Debugger.Utility.FileSystem.OpenFile(filename);
        }
        else
        {
            return;
        }
        txtWriter = CreateTextWriter(logFile);
    }

    let outputBuffer = lastOutputBuffer
    let outputBufferLen = lastOutputBufferLength

    if (outputBuffer.address != 0)
    {
        try
        {
            let outputData = host.memory.readMemoryValues(outputBuffer, outputBufferLen, 1);
            txtWriter.WriteLine("\tOutput data @0x" + outputBuffer.toString(16) + ": " + outputData);
        }
        catch (e) {}
    }
}

function LogIoctlArgs()
{
    let dbgOutput = host.diagnostics.debugLog;

    if ((logFile === 0) || (txtWriter === 0))
    {
        if (host.namespace.Debugger.Utility.FileSystem.FileExists(filename))
        {
            logFile = host.namespace.Debugger.Utility.FileSystem.CreateFile(filename, "OpenExisting");
        }
        else
        {
            dbgOutput("Creating new log file\n");
            logFile = host.namespace.Debugger.Utility.FileSystem.CreateFile(filename);
        }
        txtWriter = CreateTextWriter(logFile);
    }

    txtWriter.WriteLine("\nNtDeviceIoControlFile arguments:");

    let callingProcessName = host.currentProcess.Name;
    let callingProcessId = host.currentProcess.Id;
    txtWriter.WriteLine("\tProcess: " + callingProcessName + " (" + callingProcessId + ")");

    let fileHandle = host.currentThread.Stack.Frames[0].Parameters.FileHandle;
    let targetDeviceName = host.currentProcess.Io.Handles[fileHandle].Object.UnderlyingObject.FileName;
    let targetDriverName = host.currentProcess.Io.Handles[fileHandle].Object.UnderlyingObject.Device.Driver.DriverName;

    txtWriter.WriteLine("\tDevice: " + targetDeviceName + " (Driver: " + targetDriverName + ")");

    let ioctlCode = host.currentThread.Stack.Frames[0].Parameters.IoControlCode;
    txtWriter.WriteLine("\tIOCTL code: 0x" + ioctlCode.toString(16));

    let inputBuffer = host.currentThread.Stack.Frames[0].Parameters.InputBuffer;
    txtWriter.WriteLine("\tInput Buffer address: 0x" + inputBuffer.address.toString(16));
    let inputBufferLen = host.currentThread.Stack.Frames[0].Parameters.InputBufferLength;
    txtWriter.WriteLine("\tInput Buffer length: 0x" + inputBufferLen.toString(16));

    // read input buffer
    if (inputBuffer.address != 0)
    {
        try
        {
            let inputData = host.memory.readMemoryValues(inputBuffer.address, inputBufferLen, 1);
            txtWriter.WriteLine("\tInput data: " + inputData);
        }
        catch (e) {}
    }

    let outputBuffer = host.currentThread.Stack.Frames[0].Parameters.OutputBuffer;
    txtWriter.WriteLine("\tOutput Buffer address: 0x" + outputBuffer.address.toString(16));
    let outputBufferLen = host.currentThread.Stack.Frames[0].Parameters.OutputBufferLength;
    txtWriter.WriteLine("\tOutput Buffer length: 0x" + outputBufferLen.toString(16));

    // save the output buffer and output buffer length so we can use them on function exit (best effort, this won't always be accurate)
    lastOutputBuffer = outputBuffer.address;
    lastOutputBufferLength = outputBufferLen;
}

function DefineNtDeviceIoControlFileSignature()
{
    if (sym === 0)
    {
        sym = host.namespace.Debugger.Utility.SymbolBuilder.CreateSymbols("nt", {AutoImportSymbols: true});
    }
    // hardcode function size because I'm lazy
	let NtDeviceIoControlFileSize = 0x62;
    let psNtosBase = host.getModuleSymbolAddress("nt", "PsNtosImageBase");
    let ntosBase = host.memory.readMemoryValues(psNtosBase, 1, 8);
    let pNtDeviceIoControlFile = host.getModuleSymbolAddress("nt", "NtDeviceIoControlFile");
    let ntDeviceIoControlSym = sym.Functions.Create("NtDeviceIoControlFile", "int", host.parseInt64(pNtDeviceIoControlFile, 16).subtract(ntosBase[0]), NtDeviceIoControlFileSize);
    let fileHandle = ntDeviceIoControlSym.Parameters.Add("FileHandle", "__int64");
    fileHandle.LiveRanges.Add(0, 8, "@rcx");
    let event = ntDeviceIoControlSym.Parameters.Add("Event", "__int64");
    event.LiveRanges.Add(0, 8, "@rdx");
    let apcRoutine = ntDeviceIoControlSym.Parameters.Add("ApcRoutine", "void*");
    apcRoutine.LiveRanges.Add(0, 8, "@r8");
    let apcContext = ntDeviceIoControlSym.Parameters.Add("ApcContext", "void*");
    apcContext.LiveRanges.Add(0, 8, "@r9");
    let ioStarusBlock = ntDeviceIoControlSym.Parameters.Add("IoStatusBlock", "_IO_STATUS_BLOCK*");
    ioStarusBlock.LiveRanges.Add(0, 8, "[@rsp + 28]");
    let ioctl = ntDeviceIoControlSym.Parameters.Add("IoControlCode", "int");
    ioctl.LiveRanges.Add(0, 4, "[@rsp + 30]");
    let inputBuffer = ntDeviceIoControlSym.Parameters.Add("InputBuffer", "void*");
    inputBuffer.LiveRanges.Add(0, 4, "[@rsp + 38]");
    let inputBufferLength = ntDeviceIoControlSym.Parameters.Add("InputBufferLength", "int");
    inputBufferLength.LiveRanges.Add(0, 4, "[@rsp + 40]");
    let outputBuffer = ntDeviceIoControlSym.Parameters.Add("OutputBuffer", "void*");
    outputBuffer.LiveRanges.Add(0, 4, "[@rsp + 48]");
    let outputBufferLength = ntDeviceIoControlSym.Parameters.Add("OutputBufferLength", "int");
    outputBufferLength.LiveRanges.Add(0, 4, "[@rsp + 50]");
}
