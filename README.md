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
