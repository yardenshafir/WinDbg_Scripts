# WinDbg_Scripts
Useful scripts for WinDbg using the debugger data model

Usage, examples, explanations and general rants (also available in PDF form here):

https://medium.com/@yardenshafir2/windbg-the-fun-way-part-1-2e4978791f9b  </br>
https://medium.com/@yardenshafir2/windbg-the-fun-way-part-2-7a904cba5435

## Useful Commands and Syntax
- <b>__iserror(x)</b>   
Returns true if a statement throws an error.
```
dx @$curprocess.Io.Handles.Where(h => !__iserror(h.Type == "File") && h.Type == "File")
```

- <b>SelectMany</b>  
Flattens a nested collection, for example runs a query on all threads in all processes and flattens the results
```
dx @$cursession.Processes.SelectMany(p => p.Threads.Select(t => t.KernelObject.ThreadName))
```

- <b>Conditional Operations</b>
```
dx @$curthread.KernelObject.ActiveImpersonationInfo != 0 ? @$curthread.KernelObject.ClientSecurity.ImpersonationLevel : "Not Impersonating"
```

- <b>Executing a Legacy Command</b>
```
dx @$printSecurityDescriptor = (sd => Debugger.Utility.Control.ExecuteCommand("!sd " + ((__int64)sd).ToDisplayString("x") + " 1"))
```

- <b>Cast Pointer to Function Address</b>
```
dx @$curprocess.Threads.Select(t => (void(*)())t.KernelObject.StartAddress)
```

## String Types and Conversions
WinDbg uses regular, null terminated strings.
That can be challenging when trying to compare them with Windows strings, which can be counted strings (ANSI or UNICODE strings) or wide strings.
To fix that, you can cast Windows strings into "regular" strings with .ToDisplayString:
- .ToDisplayString("s"): convert a char array (not a wide string) to a string. Outout string will be wrapped in double quotes.
- .ToDisplayString("sb"): convert a char array (not a wide string) to a string. Outout string will not be wrapped in double quotes.
- .ToDisplayString("su"): convert a wchar_t array (wide string) to a string. Outout string will be wrapped in double quotes.

To convert a counted string to a basic string, convert the Buffer field of the counted string using .ToDisplayString(). For example, to convert an ANSI_STRING to a string:
```
dx (@$CountedString->Buffer).ToDisplayString("sb")
```

As another example, you can create a helper function to compare a user-defined path to the ObjectName field of an OBJECT_ATTRIBUTES structure. ObjectName is a wide string so use .ToDisplayString("su"), and wrap the requested string in double quotes to match the output received from .ToDisplayString("su").
In this helper function, the two arguments are:
- o: a pointer to an OBJECT_ATTRIBUTES structure
- p: a string to be compared to the ObjectName field of the OBJECT_ATRIBUTES structure passed in argument o
```
@$comparePathFromObjAttr = ((o, p) => (((nt!_OBJECT_ATTRIBUTES*)o)->ObjectName->Buffer).ToDisplayString("su") == "\"" + p + "\"")
```
