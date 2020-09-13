package com.example.companionapp;

import java.io.File;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ComponentName;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.Environment;
import android.os.IBinder;
import android.util.Log;
import android.view.KeyEvent;
import android.widget.ProgressBar;
import android.widget.Toast;

import com.example.companionapp.FileTransferReceiver.*;

public class FileTransferReceiverActivity extends Activity {
    private static final String TAG = "FileTransferReceiverActivity";
    private static boolean mIsUp = false;
    private static final String DEST_DIRECTORY = Environment.getExternalStorageDirectory().getAbsolutePath();
    private int mTransId;
    private Context mCtxt;
    private String mDirPath;
    private String mFilePath;
    private AlertDialog mAlert;
    private ProgressBar mRecvProgressBar;
    private FileTransferReceiver mReceiverService;
    private ServiceConnection mServiceConnection = new ServiceConnection() {
        @Override
        public void onServiceDisconnected(ComponentName name) {
            Log.i(TAG, "Service disconnected");
            mReceiverService = null;
        }

        @Override
        public void onServiceConnected(ComponentName arg0, IBinder binder) {
            Log.d(TAG, "Service connected");
            mReceiverService = ((ReceiverBinder) binder).getService();
            mReceiverService.registerFileAction(getFileAction());
        }
    };

    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.ft_receiver_activity);
        mIsUp = true;
        mCtxt = getApplicationContext();
        mRecvProgressBar = (ProgressBar) findViewById(R.id.RecvProgress);
        mRecvProgressBar.setMax(100);
        if (!Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED)) {
            Toast.makeText(mCtxt, " No SDCARD Present", Toast.LENGTH_SHORT).show();
            finish();
        } else {
            mDirPath = Environment.getExternalStorageDirectory() + File.separator + "FileTransferReceiver";
            File file = new File(mDirPath);
            if (file.mkdirs()) {
                Toast.makeText(mCtxt, " Stored in " + mDirPath, Toast.LENGTH_LONG).show();
            }
        }
        mCtxt.bindService(new Intent(getApplicationContext(), FileTransferReceiver.class),
                this.mServiceConnection, Context.BIND_AUTO_CREATE);
    }

    @Override
    protected void onStart() {
        mIsUp = true;
        super.onStart();
    }

    @Override
    protected void onStop() {
        mIsUp = false;
        super.onStop();
    }

    @Override
    protected void onPause() {
        mIsUp = false;
        super.onPause();
    }

    @Override
    protected void onResume() {
        mIsUp = true;
        super.onResume();
    }

    public void onDestroy() {
        mIsUp = false;
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        mIsUp = false;
        moveTaskToBack(true);
    }

    // for Android before 2.0, just in case
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            mIsUp = false;
            moveTaskToBack(true);
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    public static boolean isUp()
    {
        return mIsUp;
    }

    private FileAction getFileAction() {
        return new FileAction() {
            @Override
            public void onFileActionError() {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (mAlert != null && mAlert.isShowing()) {
                            mAlert.dismiss();
                        }
                        Toast.makeText(mCtxt, "Transfer cancelled " + "Error", Toast.LENGTH_SHORT).show();
                        mRecvProgressBar.setProgress(0);
                    }
                });
            }

            @Override
            public void onFileActionProgress(final long progress) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        mRecvProgressBar.setProgress((int) progress);
                    }
                });
            }

            @Override
            public void onFileActionTransferComplete() {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        mRecvProgressBar.setProgress(0);
                        if (mAlert != null) {
                            mAlert.dismiss();
                        }
                        Toast.makeText(mCtxt, "Receive Completed!", Toast.LENGTH_SHORT).show();
                    }
                });
            }

            @Override
            public void onFileActionTransferRequested(int id, String path) {
                mFilePath = path;
                mTransId = id;
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        AlertDialog.Builder alertbox = new AlertDialog.Builder(FileTransferReceiverActivity.this);
                        alertbox.setMessage("Do you want to receive file: " + mFilePath + " ?");
                        alertbox.setPositiveButton("Accept",
                                new DialogInterface.OnClickListener() {
                                    public void onClick(DialogInterface arg0, int arg1) {
                                        mAlert.dismiss();
                                        try {
                                            String receiveFileName = mFilePath.substring(mFilePath.lastIndexOf("/"), mFilePath.length());
                                            mReceiverService.receiveFile(mTransId, DEST_DIRECTORY
                                                    + receiveFileName, true);
                                            Log.i(TAG, "Transfer accepted");
                                            showQuitDialog();
                                        } catch (Exception e) {
                                            e.printStackTrace();
                                            Toast.makeText(mCtxt, "IllegalArgumentException", Toast.LENGTH_SHORT).show();
                                        }
                                    }
                                });
                        alertbox.setNegativeButton("Reject",
                                new DialogInterface.OnClickListener() {
                                    public void onClick(DialogInterface arg0, int arg1) {
                                        mAlert.dismiss();
                                        try {
                                            mReceiverService.receiveFile(mTransId, DEST_DIRECTORY, false);
                                            Log.i(TAG, "Transfer rejected");
                                        } catch (Exception e) {
                                            e.printStackTrace();
                                            Toast.makeText(mCtxt, "IllegalArgumentException", Toast.LENGTH_SHORT).show();
                                        }
                                    }
                                });
                        alertbox.setCancelable(false);
                        mAlert = alertbox.create();
                        mAlert.show();
                    }
                });
            }
        };
    }

    private void showQuitDialog() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                AlertDialog.Builder alertbox = new AlertDialog.Builder(FileTransferReceiverActivity.this);
                alertbox = new AlertDialog.Builder(FileTransferReceiverActivity.this);
                alertbox.setMessage("Receiving file : [" + mFilePath + "] QUIT?");
                alertbox.setNegativeButton("OK", new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface arg0, int arg1) {
                        try {
                            mReceiverService.cancelFileTransfer(mTransId);
                        } catch (Exception e) {
                            e.printStackTrace();
                            Toast.makeText(mCtxt, "IllegalArgumentException", Toast.LENGTH_SHORT).show();
                        }
                        mAlert.dismiss();
                        mRecvProgressBar.setProgress(0);
                    }
                });
                alertbox.setCancelable(false);
                mAlert = alertbox.create();
                mAlert.show();
            }
        });
    }
}
