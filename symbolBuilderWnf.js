"use strict";

function initializeScript()
{
    return [new host.apiVersionSupport(1, 7),
            new host.functionAlias(AddSymbolsToDll, "CreateSym"),
            new host.functionAlias(GeneralSymbols, "GeneralSymbols"),
            new host.functionAlias(WnfSymbols, "WnfSymbols")];
}

function invokeScript()
{
    //
    // Insert your script content here.  This method will be called whenever the script is
    // invoked from a client.
    //
    // See the following for more details:
    //
    //     https://aka.ms/JsDbgExt
    //
}

//
// To use:
// 1. Build and load SymbolBuilderComposition.dll from here:
//    https://github.com/microsoft/WinDbg-Samples/blob/master/TargetComposition/SymBuilder/Readme.txt
// 2. Call AddSymbolsToDll with your chosen dll name to add the symbols to:
//    dx @$testSym = @$CreateSym("nsi.dll")
// 3. Add the general symbols to the dll (those are required for the WNF symbols):
//    dx @$GeneralSymbols(@$testSym)
// 4. Add WNF symbols to the dll:
//    dx @$WnfSymbols(@$testSym)
// 5. In the debugger run .reload
// 
// Now all new symbols are available in the DLL you chose in step 2
//

function AddSymbolsToDll(dllName)
{
    return host.namespace.Debugger.Utility.SymbolBuilder.CreateSymbols(dllName);
}

function GeneralSymbols(sym)
{
    var rtlBalancedNode = sym.Types.Create("_RTL_BALANCED_NODE");
    rtlBalancedNode.Fields.Add("Left", "_RTL_BALANCED_NODE*");
    rtlBalancedNode.Fields.Add("Right", "_RTL_BALANCED_NODE*");
    rtlBalancedNode.Fields.Add("ParentValue", "char");

    var rtlRbTree = sym.Types.Create("_RTL_RB_TREE");
    rtlRbTree.Fields.Add("Root", "_RTL_BALANCED_NODE*");
    rtlRbTree.Fields.Add("Min", "_RTL_BALANCED_NODE*");

    var listEntry = sym.Types.Create("_LIST_ENTRY");
    listEntry.Fields.Add("Flink", "_LIST_ENTRY*");
    listEntry.Fields.Add("Blink", "_LIST_ENTRY*");

    var guid = sym.Types.Create("_GUID");
    guid.Fields.Add("Data1", "int");
    guid.Fields.Add("Data2", "int");
    guid.Fields.Add("Data3", "int");
    guid.Fields.Add("Data4_0", "char");
    guid.Fields.Add("Data4_1", "char");
    guid.Fields.Add("Data4_2", "char");
    guid.Fields.Add("Data4_3", "char");
    guid.Fields.Add("Data4_4", "char");
    guid.Fields.Add("Data4_5", "char");
    guid.Fields.Add("Data4_6", "char");
    guid.Fields.Add("Data4_7", "char");
}

function WnfSymbols(sym)
{
    var wnfNodeHeader = sym.Types.Create("_WNF_NODE_HEADER");
    wnfNodeHeader.Fields.Add("NodeTypeCode", "wchar_t");
    wnfNodeHeader.Fields.Add("NodeByteSize", "wchar_t");

    var wnfTypeId = sym.Types.Create("_WNF_TYPE_ID");
    wnfTypeId.Fields.Add("TypeId", "_GUID");

    var wnfStateName = sym.Types.Create("_WNF_STATE_NAME");
    wnfStateName.Fields.Add("Data1", "int");
    wnfStateName.Fields.Add("Data2", "int");

    var wnfSubscriptionTable = sym.Types.Create("_WNF_SUBSCRIPTION_TABLE");
    wnfSubscriptionTable.Fields.Add("Header", "_WNF_NODE_HEADER");
    wnfSubscriptionTable.Fields.Add("NamesTableLock", "void*");
    wnfSubscriptionTable.Fields.Add("NamesTree", "_RTL_RB_TREE");
    wnfSubscriptionTable.Fields.Add("SerializationGroupListHead", "_LIST_ENTRY");
    wnfSubscriptionTable.Fields.Add("SerializationListLock", "void*");
    wnfSubscriptionTable.Fields.Add("Unknown1", "int");
    wnfSubscriptionTable.Fields.Add("Unknown2", "int");
    wnfSubscriptionTable.Fields.Add("SubscribedEventSet", "int");
    wnfSubscriptionTable.Fields.Add("Unknown3", "int");
    wnfSubscriptionTable.Fields.Add("Unknown4", "int");
    wnfSubscriptionTable.Fields.Add("Timer", "void*");
    wnfSubscriptionTable.Fields.Add("TimerDueTime", "__int64");

    var wnfDeliveryDescriptor = sym.Types.Create("_WNF_DELIVERY_DESCRIPTOR");
    wnfDeliveryDescriptor.Fields.Add("SubscriptionId", "__int64");
    wnfDeliveryDescriptor.Fields.Add("StateName", "_WNF_STATE_NAME");
    wnfDeliveryDescriptor.Fields.Add("ChangeStamp", "int");
    wnfDeliveryDescriptor.Fields.Add("StateDataSize", "int");
    wnfDeliveryDescriptor.Fields.Add("EventMask", "int");
    wnfDeliveryDescriptor.Fields.Add("TypeId", "_WNF_TYPE_ID");
    wnfDeliveryDescriptor.Fields.Add("StateDataOffset", "int");

    var wnfNameSubscription = sym.Types.Create("_WNF_NAME_SUBSCRIPTION");
    wnfNameSubscription.Fields.Add("Header", "_WNF_NODE_HEADER");
    wnfNameSubscription.Fields.Add("SubscriptionId", "__int64");
    wnfNameSubscription.Fields.Add("StateName", "_WNF_STATE_NAME");
    wnfNameSubscription.Fields.Add("CurrentChangeStamp", "int");
    wnfNameSubscription.Fields.Add("NamesTreeNode", "_RTL_BALANCED_NODE");
    wnfNameSubscription.Fields.Add("TypeId", "_WNF_TYPE_ID*");
    wnfNameSubscription.Fields.Add("NameSubscriptionLock", "void*");
    wnfNameSubscription.Fields.Add("SubscriptionsListHead", "_LIST_ENTRY");
    wnfNameSubscription.Fields.Add("NormalDeliverySubscriptions", "int");
    wnfNameSubscription.Fields.Add("Unknown1", "int");
    wnfNameSubscription.Fields.Add("NotificationTypeCount0", "int");
    wnfNameSubscription.Fields.Add("NotificationTypeCount1", "int");
    wnfNameSubscription.Fields.Add("NotificationTypeCount2", "int");
    wnfNameSubscription.Fields.Add("NotificationTypeCount3", "int");
    wnfNameSubscription.Fields.Add("NotificationTypeCount4", "int");
    wnfNameSubscription.Fields.Add("Unknown2", "int");
    wnfNameSubscription.Fields.Add("Unknown3", "int");
    wnfNameSubscription.Fields.Add("RetryDescriptor", "_WNF_DELIVERY_DESCRIPTOR*");
    wnfNameSubscription.Fields.Add("DeliveryState", "int");
    wnfNameSubscription.Fields.Add("ReliableRetryTime", "__int64");

    var wnfUserSubscription = sym.Types.Create("_WNF_USER_SUBSCRIPTION");
    wnfUserSubscription.Fields.Add("Header", "_WNF_NODE_HEADER");
    wnfUserSubscription.Fields.Add("SubscriptionsListEntry", "_LIST_ENTRY");
    wnfUserSubscription.Fields.Add("NameSubscription", "_WNF_NAME_SUBSCRIPTION*");
    wnfUserSubscription.Fields.Add("Callback", "void*");
    wnfUserSubscription.Fields.Add("CallbackContext", "void*");
    wnfUserSubscription.Fields.Add("SubProcessTag", "__int64");
    wnfUserSubscription.Fields.Add("ChangeStamp", "int");
    wnfUserSubscription.Fields.Add("DeliveryOptions", "int");
    wnfUserSubscription.Fields.Add("SubscribedEventSet", "int");
    wnfUserSubscription.Fields.Add("SerializationGroup", "void*");
    wnfUserSubscription.Fields.Add("UserSubscriptionCount", "int");
    wnfUserSubscription.Fields.Add("Unknown1", "__int64");
    wnfUserSubscription.Fields.Add("Unknown2", "__int64");
    wnfUserSubscription.Fields.Add("Unknown3", "__int64");
    wnfUserSubscription.Fields.Add("Unknown4", "__int64");
    wnfUserSubscription.Fields.Add("Unknown5", "__int64");
    wnfUserSubscription.Fields.Add("Unknown6", "__int64");
    wnfUserSubscription.Fields.Add("Unknown7", "__int64");
    wnfUserSubscription.Fields.Add("Unknown8", "__int64");
    wnfUserSubscription.Fields.Add("Unknown9", "__int64");
    wnfUserSubscription.Fields.Add("Unknown10", "__int64");
}

function TestNewSymbols()
{
    var sym = host.namespace.Debugger.Utility.SymbolBuilder.CreateSymbols("nduprov.dll");
    var foo = sym.Types.Create("foo");
    foo.Fields.Add("x", "int");
}
