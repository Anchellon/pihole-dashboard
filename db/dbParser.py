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

turnOnRes = focusCur.execute("SELECT domain from focusdb where startTimeH =" + str(now.hour) +" and startTimeM <" + str(now.minute))
links = turnOnRes.fetchall()
for link in links:
    domainName = link[0]
    cur.execute("INSERT INTO domainlist(id,type,domain,enabled,date_added,date_modified,comment) VALUES("+str(id)+",3,\""+domainName+"\",true,"+ str(time.mktime(now.timetuple()))+","+str(time.mktime(now.timetuple()))+",\"\");")


turnOffRes = focusCur.execute("SELECT domain from focusdb where endTimeH =" + str(now.hour) +" and endTimeM <" + str(now.minute))
links = turnOnRes.fetchall()
for link in links:
    domainName = link[0]
    cur.execute("INSERT INTO domainlist(id,type,domain,enabled,date_added,date_modified,comment) VALUES("+str(id)+",3,\""+domainName+"\",false,"+ str(time.mktime(now.timetuple()))+","+str(time.mktime(now.timetuple()))+",\"\");")
focusCon.commit()
con.commit()
os.system("pihole -g")

