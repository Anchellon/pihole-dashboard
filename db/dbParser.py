import sqlite3
from datetime import datetime
import time
import os
now = datetime.now()

focusCon = sqlite3.connect("focus.db")
# con = sqlite3.connect("test_db/gravity_old.db")
con = sqlite3.connect("/etc/pihole/gravity.db")


focusCur = focusCon.cursor()
cur = con.cursor()
dlId = cur.execute("SELECT * FROM domainlist ORDER BY id DESC LIMIT 1;")
id = dlId.fetchone()[0] + 1


# (3,<linktext>,true, Date.now() / 1000,Date.now() / 1000,"")

turnOnRes = focusCur.execute("SELECT domainName from focusdb where startTimeH =" + now.hour +" and startTimeM <" + now.minute)
links = turnOnRes.fetchall()
for link in links:
    domainName = link[0]
    cur.execute("INSERT INTO domainlist(id,type,domain,enabled,date_added,date_modified,comment) VALUES("+id+",3,"+domainName+",true,"+ time.mktime(now.timetuple())+","+time.mktime(now.timetuple())+","") ON CONFLICT("+domainName+") DO NOTHING;")


turnOffRes = focusCur.execute("SELECT domainName from focusdb where endTimeH =" + now.hour +" and endTimeM <" + now.minute)
links = turnOnRes.fetchall()
for link in links:
    domainName = link[0]
    cur.execute("INSERT INTO domainlist(id,type,domain,enabled,date_added,date_modified,comment) VALUES("+id+",3,"+domainName+",false,"+ time.mktime(now.timetuple())+","+time.mktime(now.timetuple())+","") ON CONFLICT("+domainName+") DO NOTHING;")
focusCon.commit()
con.commit()
os.system("pihole -g")

