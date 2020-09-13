package com.example.companionapp;

import java.io.UnsupportedEncodingException;

import android.content.Context;
import android.content.Intent;
import android.os.Binder;
import android.os.IBinder;
import android.util.Log;
import android.widget.Toast;

import com.samsung.android.sdk.SsdkUnsupportedException;
import com.samsung.android.sdk.accessory.*;
import com.samsung.android.sdk.accessoryfiletransfer.*;
import com.samsung.android.sdk.accessoryfiletransfer.SAFileTransfer.*;

public class FileTransferReceiver extends SAAgent {
    private static final String TAG = "FileTransferReceiver";
    private Context mContext;
    private final IBinder mReceiverBinder = new ReceiverBinder();
    private static final Class<ServiceConnection> SASOCKET_CLASS = ServiceConnection.class;
    private ServiceConnection mConnection = null;
    private SAFileTransfer mSAFileTransfer = null;
    private EventListener mCallback;
    private FileAction mFileAction = null;

    public FileTransferReceiver() {
        super(TAG, SASOCKET_CLASS);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        mContext = getApplicationContext();
        Log.d(TAG, "On Create of Sample FileTransferReceiver Service");
        mCallback = new EventListener() {
            @Override
            public void onProgressChanged(int transId, int progress) {
                Log.d(TAG, "onProgressChanged : " + progress + " for transaction : " + transId);
                if (mFileAction != null) {
                    mFileAction.onFileActionProgress(progress);
                }
            }

            @Override
            public void onTransferCompleted(int transId, String fileName, int errorCode) {
                Log.d(TAG, "onTransferCompleted: tr id : " + transId + " file name : " + fileName + " error : "
                        + errorCode);
                if (errorCode == SAFileTransfer.ERROR_NONE) {
                    mFileAction.onFileActionTransferComplete();
                } else {
                    mFileAction.onFileActionError();
                }
            }

            @Override
            public void onTransferRequested(int id, String fileName) {
                Log.d(TAG, "onTransferRequested: id- " + id + " file name: " + fileName);
                if (FileTransferReceiverActivity.isUp()) {
                    Log.d(TAG, "Activity is up");
                    mFileAction.onFileActionTransferRequested(id, fileName);
                } else {
                    Log.d(TAG, "Activity is not up, invoke activity");
                    mContext.startActivity(new Intent()
                            .setClass(mContext, FileTransferReceiverActivity.class)
                            .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            .setAction("incomingFT").putExtra("tx", id)
                            .putExtra("fileName", fileName));
                    int counter = 0;
                    while (counter < 10) {
                        counter++;
                        try {
                            Thread.sleep(500);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                        if (mFileAction != null) {
                            mFileAction.onFileActionTransferRequested(id, fileName);
                            break;
                        }
                    }
                }
            }

            @Override
            public void onCancelAllCompleted(int errorCode) {
                mFileAction.onFileActionError();
                Log.e(TAG, "onCancelAllCompleted: Error Code " + errorCode);
            }
        };
        SAft saft = new SAft();
        try {
            saft.initialize(this);
        } catch (SsdkUnsupportedException e) {
            if (e.getType() == SsdkUnsupportedException.DEVICE_NOT_SUPPORTED) {
                Toast.makeText(getBaseContext(), "Cannot initialize, DEVICE_NOT_SUPPORTED", Toast.LENGTH_SHORT).show();
            } else if (e.getType() == SsdkUnsupportedException.LIBRARY_NOT_INSTALLED) {
                Toast.makeText(getBaseContext(), "Cannot initialize, LIBRARY_NOT_INSTALLED.", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(getBaseContext(), "Cannot initialize, UNKNOWN.", Toast.LENGTH_SHORT).show();
            }
            e.printStackTrace();
            return;
        } catch (Exception e1) {
            Toast.makeText(getBaseContext(), "Cannot initialize, SAft.", Toast.LENGTH_SHORT).show();
            e1.printStackTrace();
            return;
        }
        mSAFileTransfer = new SAFileTransfer(FileTransferReceiver.this, mCallback);
    }

    @Override
    public IBinder onBind(Intent arg0) {
        return mReceiverBinder;
    }

    @Override
    public void onDestroy() {
        mSAFileTransfer.close();
        mSAFileTransfer = null;
        super.onDestroy();
        Log.i(TAG, "FileTransferReceiver Service is Stopped.");
    }

    @Override
    protected void onFindPeerAgentsResponse(SAPeerAgent[] peerAgents, int result) {
        if (mConnection == null) {
            Log.d(TAG, "onFindPeerAgentResponse : mConnection is null");
        }
    }

    @Override
    protected void onServiceConnectionResponse(SAPeerAgent peer, SASocket socket, int result) {
        Log.i(TAG, "onServiceConnectionResponse: result - " + result);
        if (result == SAAgent.CONNECTION_SUCCESS) {
            if (socket != null) {
                mConnection = (ServiceConnection) socket;
                Toast.makeText(getBaseContext(), "Connection established for FT", Toast.LENGTH_SHORT).show();
            }
        }
    }

    public void receiveFile(int transId, String path, boolean bAccept) {
        Log.d(TAG, "receiving file : transId: " + transId + "bAccept : " + bAccept);
        if (mSAFileTransfer != null) {
            if (bAccept) {
                mSAFileTransfer.receive(transId, path);
            } else {
                mSAFileTransfer.reject(transId);
            }
        }
    }

    public void cancelFileTransfer(int transId) {
        if (mSAFileTransfer != null) {
            mSAFileTransfer.cancel(transId);
        }
    }

    public void registerFileAction(FileAction action) {
        this.mFileAction = action;
    }

    public class ReceiverBinder extends Binder {
        public FileTransferReceiver getService() {
            return FileTransferReceiver.this;
        }
    }

    public class ServiceConnection extends SASocket {
        public ServiceConnection() {
            super(ServiceConnection.class.getName());
        }

        @Override
        protected void onServiceConnectionLost(int reason) {
            Log.e(TAG, "onServiceConnectionLost: reason-" + reason);
            mConnection = null;
        }

        @Override
        public void onReceive(int channelId, byte[] data) {
            try {
                Log.i(TAG, "onReceive: channelId" + channelId + "data: " + new String(data, "UTF-8"));
            } catch (UnsupportedEncodingException e) {
                e.printStackTrace();
            }
        }

        @Override
        public void onError(int channelId, String errorMessage, int errorCode) {
            mFileAction.onFileActionError();
            Log.e(TAG, "Connection is not alive ERROR: " + errorMessage + "  " + errorCode);
        }
    }

    public interface FileAction {
        void onFileActionError();

        void onFileActionProgress(long progress);

        void onFileActionTransferComplete();

        void onFileActionTransferRequested(int id, String path);
    }
}
